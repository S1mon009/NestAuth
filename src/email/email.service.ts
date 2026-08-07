import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { type Transporter } from 'nodemailer';

/**
 * EmailService is responsible for sending emails using the nodemailer transporter.
 * It provides methods to send verification and reset password emails.
 * The service loads email templates from the filesystem and replaces placeholders with actual values before sending.
 */
@Injectable()
export class EmailService {
  /**
   * The constructor injects the MAIL_TRANSPORTER and ConfigService to configure the email sending capabilities.
   * @param {Transporter} transporter The nodemailer transporter used to send emails, injected from the EmailModule.
   * @param {ConfigService} configService The configuration service used to access environment variables.
   */
  constructor(
    @Inject('MAIL_TRANSPORTER') private readonly transporter: Transporter,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends an email using the configured transporter.
   * @param {string} to The recipient's email address.
   * @param {string} subject The email subject.
   * @param {string} html The HTML content of the email.
   * @returns {Promise<any>} A promise resolving to the result of the email sending operation.
   */
  async sendMail(to: string, subject: string, html: string): Promise<any> {
    return await this.transporter.sendMail({
      from: `"NestAuth" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject,
      html,
    });
  }

  /**
   * Loads an email template from the filesystem.
   * @param {string} name The name of the template file.
   * @returns {string} The content of the template file.
   */
  private loadTemplate(name: string): string {
    const filePath = join(__dirname, 'templates', name);
    return readFileSync(filePath, 'utf8');
  }

  /**
   * Sends a verification email to the specified recipient.
   * @param {string} email The recipient's email address.
   * @param {string} token The verification token.
   * @returns {Promise<any>} A promise resolving to the result of the email sending operation.
   */
  async sendVerificationEmail(email: string, token: string): Promise<any> {
    const template = this.loadTemplate('verify-email.html');
    const host: string =
      this.configService.get<string>('FRONTEND_URL') ||
      `${this.configService.get<string>('HOST')}:${this.configService.get<string>('PORT')}/${this.configService.get<string>('API_VERSION')}`;

    const url: string = `${host}/auth/verify-email?token=${token}`;

    const html = template.replaceAll('{{verificationLink}}', url);

    return this.sendMail(email, 'Verify your email', html);
  }

  /**
   * Sends a reset password email to the specified recipient.
   * @param {string} email The recipient's email address.
   * @param {string} token The reset password token.
   * @returns {Promise<any>} A promise resolving to the result of the email sending operation.
   */
  async sendResetPasswordEmail(email: string, token: string): Promise<any> {
    const template = this.loadTemplate('reset-password.html');

    const host: string | undefined =
      this.configService.get<string>('FRONTEND_URL');

    const url: string = `${host}/auth/reset-password?token=${token}`;

    const html = template.replaceAll('{{resetLink}}', url);

    return this.sendMail(email, 'Reset your password', html);
  }
}
