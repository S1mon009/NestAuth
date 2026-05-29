import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LogsModule } from './logs/logs.module';

/**
 * The main application module that imports and configures all other modules and global providers.
 * This module sets up the configuration, database connection, caching, event handling, and rate limiting for the application.
 * It also imports the AuthModule, UsersModule, and LogsModule to provide authentication, user management, and logging functionality throughout the application.
 */
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
        CACHE_TTL: Joi.number().default(5000),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 20,
      },
    ]),
    EventEmitterModule.forRoot(),
    CacheModule.register({
      ttl: Number(process.env.CACHE_TTL),
      isGlobal: true,
    }),
    MongooseModule.forRoot(String(process.env.MONGO_URI)),
    AuthModule,
    UsersModule,
    LogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
