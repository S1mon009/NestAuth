import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailModule } from '../email/email.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Profile, ProfileSchema } from '../users/schemas/profile.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';

/**
 * AuthModule is a NestJS module responsible for handling authentication and authorization in the application. It imports necessary modules such as ConfigModule for configuration management, MongooseModule for database interactions, PassportModule for authentication strategies, and JwtModule for JWT handling.
 * The module defines controllers and providers related to authentication, including the AuthController for handling authentication-related HTTP requests and the AuthService for implementing authentication logic. It also includes the JwtStrategy for validating JWT tokens.
 * The AuthModule is exported to be used in other parts of the application where authentication functionality is required.
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_IN) },
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, MongooseModule],
})
export class AuthModule {}
