import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.number().required(),
        JWT_RESET_PASSWORD_EXPIRES_IN: Joi.number().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_EXPIRES_IN: Joi.number().required(),
        COOKIE_SECURE: Joi.boolean().required(),
        COOKIE_SAME_SITE: Joi.string()
          .valid('strict', 'lax', 'none')
          .required(),
        MONGO_URI: Joi.string().uri().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        BCRYPT_SALT: Joi.number().required(),
        FRONTEND_URL: Joi.string().uri().allow('').optional(),
        API_VERSION: Joi.string().default('v1'),
        PORT: Joi.number().default(3000),
        SERVER_URL: Joi.string().uri().default('http://localhost'),
      }),
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(String(process.env.MONGO_URI)),
    AuthModule,
    UsersModule,
    LogsModule,
  ],
})
export class AppModule {}
