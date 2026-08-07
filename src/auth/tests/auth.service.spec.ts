// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { EmailService } from 'src/email/email.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Profile } from 'src/users/schemas/profile.schema';
import { VerifyEmailStatus } from '../dto';

const mockUser = (
  overrides: Partial<UserDocument> = {},
): Partial<UserDocument> => ({
  _id: 'user-id-123' as any,
  id: 'user-id-123',
  email: 'test@example.com',
  password: 'hashed-password',
  role: 'user',
  isVerified: true,
  refreshToken: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userModel: jest.Mocked<Model<UserDocument>>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile.name),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('throws BadRequestException when email already exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser() as UserDocument);

      await expect(
        service.register('test@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({ type: 'warning' }),
      );
    });

    it('creates user, profile, sends verification email and returns success message', async () => {
      // findOne musi zwrócić null (brak duplikatu) — PRZED podmianą modelu
      userModel.findOne.mockResolvedValue(null);

      const savedUser = mockUser();
      const savedProfile = { save: jest.fn().mockResolvedValue(undefined) };

      // Podmiana modelu na konstruktor z zachowaniem findOne
      const mockUserModel = jest.fn().mockReturnValue(savedUser);
      mockUserModel.findOne = jest.fn().mockResolvedValue(null);
      (service as any).userModel = mockUserModel;
      (service as any).profileModel = jest.fn().mockReturnValue(savedProfile);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      jwtService.signAsync.mockResolvedValue('verification-token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register('test@example.com', 'password123');

      expect(savedUser.save).toHaveBeenCalled();
      expect(savedProfile.save).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'verification-token',
      );
      expect(result).toEqual({
        message: 'User registered successfully, verification email sent',
      });
    });

    it('emits info event after successful registration', async () => {
      const savedUser = mockUser();
      const savedProfile = { save: jest.fn().mockResolvedValue(undefined) };

      const mockUserModel = jest.fn().mockReturnValue(savedUser);
      mockUserModel.findOne = jest.fn().mockResolvedValue(null);
      (service as any).userModel = mockUserModel;
      (service as any).profileModel = jest.fn().mockReturnValue(savedProfile);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      jwtService.signAsync.mockResolvedValue('token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register('test@example.com', 'password123');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: expect.stringContaining('registered'),
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('propagates invalid token errors from jwtService', async () => {
      const error = new Error('invalid token');
      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        'invalid token',
      );
      expect(jwtService.verify).toHaveBeenCalledWith('bad-token', {
        secret: undefined,
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-id-123',
        email: 'test@example.com',
      });
      userModel.findById.mockResolvedValue(null);

      await expect(service.verifyEmail('some-token')).rejects.toThrow(
        NotFoundException,
      );
      expect(userModel.findById).toHaveBeenCalledWith('user-id-123');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({ type: 'error' }),
      );
    });

    it('throws ConflictException when email already verified', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-id-123',
        email: 'test@example.com',
      });
      userModel.findById.mockResolvedValue(
        mockUser({ isVerified: true }) as UserDocument,
      );

      await expect(service.verifyEmail('some-token')).rejects.toThrow(
        ConflictException,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({ type: 'warning' }),
      );
    });

    it('sets isVerified to true, saves user and returns VERIFIED status', async () => {
      const user = mockUser({ isVerified: false });
      jwtService.verify.mockReturnValue({
        sub: 'user-id-123',
        email: 'test@example.com',
      });
      userModel.findById.mockResolvedValue(user as UserDocument);

      const result = await service.verifyEmail('valid-token');

      expect(user.isVerified).toBe(true);
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({ status: VerifyEmailStatus.VERIFIED });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({ type: 'info' }),
      );
    });
  });

  describe('validateUser', () => {
    it('throws UnauthorizedException when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.validateUser('no@user.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      userModel.findOne.mockResolvedValue(mockUser() as UserDocument);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateUser('test@example.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email is not verified', async () => {
      userModel.findOne.mockResolvedValue(
        mockUser({ isVerified: false }) as UserDocument,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.validateUser('test@example.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns user document on valid credentials', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user as UserDocument);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'pass');

      expect(result).toBe(user);
    });
  });

  describe('login', () => {
    it('returns accessToken, refreshToken and user info on success', async () => {
      const user = mockUser();
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(user as UserDocument);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh' as never);

      const result = await service.login('test@example.com', 'pass');

      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          email: 'test@example.com',
          role: 'user',
          userId: 'user-id-123',
        },
      });
    });

    it('stores hashed refresh token on user', async () => {
      const user = mockUser();
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(user as UserDocument);
      jwtService.signAsync.mockResolvedValue('token');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh' as never);

      await service.login('test@example.com', 'pass');

      expect(user.refreshToken).toBe('hashed-refresh');
    });

    it('emits login info event on success', async () => {
      const user = mockUser();
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(user as UserDocument);
      jwtService.signAsync.mockResolvedValue('token');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      await service.login('test@example.com', 'pass');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: expect.stringContaining('logged in'),
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('throws UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(null);

      await expect(service.refreshToken('old-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user has no stored refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(
        mockUser({ refreshToken: null }) as UserDocument,
      );

      await expect(service.refreshToken('old-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when refresh token hash does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(
        mockUser({ refreshToken: 'stored-hash' }) as UserDocument,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns new access and refresh tokens on valid refresh token', async () => {
      const user = mockUser({ refreshToken: 'stored-hash' });
      jwtService.verify.mockReturnValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(user as UserDocument);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never);

      const result = await service.refreshToken('valid-old-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(user.save).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('throws NotFoundException when user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('ghost@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('sends reset email and returns success message', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user as UserDocument);
      jwtService.signAsync.mockResolvedValue('reset-token');
      emailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(emailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        'reset-token',
      );
      expect(result).toEqual({ message: 'Reset link sent to email' });
    });

    it('emits warning event when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword('ghost@example.com'),
      ).rejects.toThrow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({ type: 'warning' }),
      );
    });
  });

  describe('verifyResetPasswordToken', () => {
    it('throws NotFoundException when user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.verifyResetPasswordToken('bad-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns valid message when token is correct', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(mockUser() as UserDocument);

      const result = await service.verifyResetPasswordToken('valid-token');

      expect(result).toEqual({ message: 'Token is valid' });
    });
  });

  describe('resetPassword', () => {
    it('throws NotFoundException when user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.resetPassword('token', 'newPass123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('hashes new password, saves user and returns success message', async () => {
      const user = mockUser();
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(user as UserDocument);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('new-hashed-password' as never);

      const result = await service.resetPassword('valid-token', 'newPass123');

      expect(user.password).toBe('new-hashed-password');
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password has been successfully reset',
      });
    });

    it('emits info event after successful password reset', async () => {
      const user = mockUser();
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });
      userModel.findById.mockResolvedValue(user as UserDocument);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      await service.resetPassword('valid-token', 'newPass123');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: expect.stringContaining('reset'),
        }),
      );
    });
  });
});
