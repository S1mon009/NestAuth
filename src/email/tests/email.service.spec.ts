// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;
  let transporter: { sendMail: jest.Mock };
  const smtpUser = 'smtp-user@example.com';
  const frontendUrl = 'https://frontend.test';

  beforeEach(async () => {
    transporter = { sendMail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: 'MAIL_TRANSPORTER',
          useValue: transporter,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return frontendUrl;
              if (key === 'SMTP_USER') return smtpUser;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('uses transporter.sendMail with configured from address', async () => {
      const expectedResult = { messageId: 'message-id' };
      transporter.sendMail.mockResolvedValue(expectedResult);

      const result = await service.sendMail(
        'user@example.com',
        'Test subject',
        '<p>Test</p>',
      );

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: `"NestAuth" <${smtpUser}>`,
        to: 'user@example.com',
        subject: 'Test subject',
        html: '<p>Test</p>',
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('sendVerificationEmail', () => {
    it('loads verify email template and sends verification link', async () => {
      const expectedResult = { messageId: 'verify-message' };
      transporter.sendMail.mockResolvedValue(expectedResult);
      const token = 'verify-token';
      const expectedUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
      const template = readFileSync(
        join(__dirname, '..', 'templates', 'verify-email.html'),
        'utf8',
      );
      const expectedHtml = template.replaceAll(
        '{{verificationLink}}',
        expectedUrl,
      );

      const result = await service.sendVerificationEmail(
        'receiver@example.com',
        token,
      );

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: `"NestAuth" <${smtpUser}>`,
        to: 'receiver@example.com',
        subject: 'Verify your email',
        html: expectedHtml,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('loads reset password template and sends reset link', async () => {
      const expectedResult = { messageId: 'reset-message' };
      transporter.sendMail.mockResolvedValue(expectedResult);
      const token = 'reset-token';
      const expectedUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
      const template = readFileSync(
        join(__dirname, '..', 'templates', 'reset-password.html'),
        'utf8',
      );
      const expectedHtml = template.replaceAll('{{resetLink}}', expectedUrl);

      const result = await service.sendResetPasswordEmail(
        'receiver@example.com',
        token,
      );

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: `"NestAuth" <${smtpUser}>`,
        to: 'receiver@example.com',
        subject: 'Reset your password',
        html: expectedHtml,
      });
      expect(result).toBe(expectedResult);
    });
  });
});
