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
import { User, UserDocument } from '../users/schemas/user.schema';
import { Profile, ProfileDocument } from '../users/schemas/profile.schema';
import { type JwtPayloadInterface } from './interfaces/jwtPayload.interface';

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

  async register(email: string, password: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email already exists');

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new this.userModel({ email, password: hashedPassword });
    await user.save();

    const profile = new this.profileModel({ userId: user._id });
    await profile.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_CREATED',
    });

    if (!process.env.JWT_SECRET) {
      throw new InternalServerErrorException('JWT_SECRET is not defined');
    }

    const verificationToken = await this.jwtService.signAsync(
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

    return { message: 'User registered successfully, verification email sent' };
  }

  async verifyEmail(token: string) {
    try {
      const payload: JwtPayloadInterface = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.userModel.findById(payload.sub);

      if (!user) throw new NotFoundException('User not found');
      if (user.isVerified) return { message: 'Email is already verified' };

      user.isVerified = true;
      await user.save();

      this.eventEmitter.emit('log.create', {
        userId: user.id,
        action: 'USER_EMAIL_VERIFIED',
      });

      if (this.configService.get<string>('FRONTEND_URL')) {
        return {
          redirect: `${this.configService.get<string>('FRONTEND_URL')}/auth/verify-email`,
        };
      }

      return { message: 'Email verified successfully' };
    } catch (err: any) {
      console.log('JWT VERIFY ERROR:', err);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: email });
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

  async login(user: UserDocument) {
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN'),
    });

    user.refreshToken = refreshToken;
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: user.id,
      action: 'USER_LOGGED_IN',
    });

    return {
      accessToken,
      refreshToken,
      user: { email: user.email, role: user.role, userId: user._id.toString() },
    };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload: JwtPayloadInterface = this.jwtService.verify(
        oldRefreshToken,
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        },
      );

      const user = await this.userModel.findById(payload.sub);
      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        email: user.email,
        sub: user._id.toString(),
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
      });

      const refreshToken = await this.jwtService.signAsync(newPayload, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN'),
      });

      user.refreshToken = refreshToken;
      await user.save();

      this.eventEmitter.emit('log.create', {
        userId: user.id,
        action: 'USER_REFRESHED_TOKEN',
      });

      return { accessToken, refreshToken };
    } catch (err: unknown) {
      console.log(err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = await this.jwtService.signAsync(
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

  async verifyResetToken(token: string) {
    try {
      const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const user: any = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return { message: 'Token is valid' };
    } catch (err: unknown) {
      console.log(err);
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const user = await this.userModel.findById(payload.sub);
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
    } catch (err: unknown) {
      console.log(err);
      throw new BadRequestException('Invalid or expired reset token');
    }
  }
}
