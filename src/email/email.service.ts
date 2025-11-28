import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(
    @Inject('MAIL_TRANSPORTER') private readonly transporter: Transporter,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(to: string, subject: string, html: string) {
    return await this.transporter.sendMail({
      from: `"NestAuth" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject,
      html,
    });
  }

  private loadTemplate(name: string): string {
    const filePath = join(__dirname, 'templates', name);
    return readFileSync(filePath, 'utf8');
  }

  async sendVerificationEmail(email: string, token: string) {
    const template = this.loadTemplate('verify-email.html');

    const url: string = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    const html = template.replaceAll('{{verificationLink}}', url);

    return this.sendMail(email, 'Verify your email', html);
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const template = this.loadTemplate('reset-password.html');

    const url: string = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    const html = template.replaceAll('{{resetLink}}', url);

    return this.sendMail(email, 'Reset your password', html);
  }
}
