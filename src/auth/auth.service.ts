import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new this.userModel({ email, password: hashedPassword });
    await user.save();

    if (!process.env.JWT_SECRET) {
      throw new InternalServerErrorException('JWT_SECRET is not defined');
    }

    const verificationToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), email: user.email },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: Number(process.env.JWT_EXPIRES_IN) || '1d',
      },
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const safeToken = encodeURIComponent(verificationToken);

    try {
      await transporter.sendMail({
        from: '"Nest Auth" <no-reply@nestauth.com>',
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Click <a href="http://localhost:3000/auth/verify-email?token=${safeToken}">here</a> to verify your email.</p>`,
      });
    } catch (err) {
      console.error('Email sending failed:', err);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    return { message: 'User registered successfully, verification email sent' };
  }

  async verifyEmail(token: string) {
    try {
      const payload: any = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.userModel.findById(payload.sub);
      if (!user) throw new NotFoundException('User not found');
      user.isVerified = true;
      await user.save();
      return { message: 'Email verified successfully' };
    } catch (err: any) {
      console.log('JWT VERIFY ERROR:', err);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(password, user.password);
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
      secret: process.env.JWT_SECRET,
      expiresIn: Number(process.env.JWT_EXPIRES_IN),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    });

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      }) as { sub: string; email: string; role: string };

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
        secret: process.env.JWT_SECRET,
        expiresIn: Number(process.env.JWT_EXPIRES_IN),
      });

      const refreshToken = await this.jwtService.signAsync(newPayload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      });

      user.refreshToken = refreshToken;
      await user.save();

      return { accessToken, refreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
