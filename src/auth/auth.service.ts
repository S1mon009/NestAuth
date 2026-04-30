import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import {
  RegisterResponseDto,
  VerifyEmailResponseDto,
  VerifyEmailStatus,
  LoginServiceResponseDto,
  RefreshTokenServiceResponseDto,
  ForgotPasswordResponseDto,
  VerifyResetPasswordTokenResponseDto,
  ResetPasswordResponseDto,
} from './dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Profile, ProfileDocument } from '../users/schemas/profile.schema';
import type {
  JwtPayloadInterface,
  JwtPayloadWithMetaInterface,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}
  async register(
    email: string,
    password: string,
  ): Promise<RegisterResponseDto> {
    const existingUser: UserDocument | null = await this.userModel.findOne({
      email,
    });
    if (existingUser) throw new BadRequestException('Email already exists');

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    const user = new this.userModel({ email, password: hashedPassword });
    await user.save();

    const profile: ProfileDocument | null = new this.profileModel({
      userId: user._id,
    });
    await profile.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_CREATED',
    });

    if (!process.env.JWT_SECRET) {
      throw new InternalServerErrorException('JWT_SECRET is not defined');
    }

    const verificationToken: string = await this.jwtService.signAsync(
      { sub: user._id.toString(), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
      },
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message: 'User registered successfully, verification email sent',
    };
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    const payload: JwtPayloadWithMetaInterface = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );
    if (!user) throw new NotFoundException();

    if (user.isVerified) {
      return { status: VerifyEmailStatus.ALREADY_VERIFIED };
    }

    user.isVerified = true;
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_EMAIL_VERIFIED',
    });

    return { status: VerifyEmailStatus.VERIFIED };
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user: UserDocument | null = await this.userModel.findOne({
      email: email,
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches: boolean = await bcrypt.compare(
      password,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new UnauthorizedException('Email not verified');

    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<LoginServiceResponseDto> {
    const user: UserDocument = await this.validateUser(email, password);
    const payload: JwtPayloadInterface = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken: string = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken: string = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn:
        this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const refreshTokenHash: string = await bcrypt.hash(
      refreshToken,
      saltRounds,
    );

    user.refreshToken = refreshTokenHash;
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_LOGGED_IN',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        role: user.role,
        userId: user._id.toString(),
      },
    };
  }

  async refreshToken(
    oldRefreshToken: string,
  ): Promise<RefreshTokenServiceResponseDto> {
    const payload: JwtPayloadWithMetaInterface = this.jwtService.verify(
      oldRefreshToken,
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const newPayload: JwtPayloadInterface = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken: string = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken: string = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN'),
    });

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const refreshTokenHash: string = await bcrypt.hash(
      refreshToken,
      saltRounds,
    );

    user.refreshToken = refreshTokenHash;
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_REFRESHED_TOKEN',
    });

    return { accessToken, refreshToken };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user: UserDocument | null = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken: string = await this.jwtService.signAsync(
      { sub: user._id.toString(), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          this.configService.get<number>('JWT_RESET_PASSWORD_EXPIRES_IN') ||
          '15m',
      },
    );

    await this.emailService.sendResetPasswordEmail(user.email, resetToken);

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_REQUESTED_PASSWORD_RESET',
    });

    return { message: 'Reset link sent to email' };
  }

  async verifyResetPasswordToken(
    token: string,
  ): Promise<VerifyResetPasswordTokenResponseDto> {
    const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Token is valid' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponseDto> {
    const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_RESET_PASSWORD',
    });

    return { message: 'Password has been successfully reset' };
  }
}
