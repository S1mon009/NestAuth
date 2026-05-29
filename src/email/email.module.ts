import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * EmailModule is responsible for providing email sending capabilities using nodemailer.
 * It imports the ConfigModule to access environment variables for SMTP configuration.
 * The module provides a MAIL_TRANSPORTER that is configured using the environment variables.
 * The EmailService is also provided and exported for use in other parts of the application.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MAIL_TRANSPORTER',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const nodemailer = await import('nodemailer');

        return nodemailer.createTransport({
          host: configService.get<string>('SMTP_HOST'),
          port: Number(configService.get<string>('SMTP_PORT')),
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        });
      },
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
