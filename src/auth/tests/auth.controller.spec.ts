// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { VerifyEmailStatus } from '../dto';

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            verifyEmail: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            verifyResetPasswordToken: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('delegates to authService.register and returns result', async () => {
      const dto = { email: 'new@user.com', password: 'secret123' };
      const expected = {
        message: 'User registered successfully, verification email sent',
      };
      authService.register.mockResolvedValue(expected);

      const result = await controller.register(dto as any);

      expect(authService.register).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result).toEqual(expected);
    });
  });

  // ── verifyEmail ───────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('passes token to authService.verifyEmail and returns result', async () => {
      const expected = { status: VerifyEmailStatus.VERIFIED };
      authService.verifyEmail.mockResolvedValue(expected);

      const result = await controller.verifyEmail('my-token');

      expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
      expect(authService.verifyEmail).toHaveBeenCalledWith('my-token');
      expect(result).toEqual(expected);
    });

    it('propagates errors from authService.verifyEmail', async () => {
      const error = new Error('verification failed');
      authService.verifyEmail.mockRejectedValue(error);

      await expect(controller.verifyEmail('my-token')).rejects.toThrow(
        'verification failed',
      );
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('sets refreshToken cookie and returns accessToken + user', async () => {
      const dto = { email: 'test@example.com', password: 'pass' };
      const serviceResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          email: 'test@example.com',
          role: 'user',
          userId: 'user-id-123',
        },
      };
      authService.login.mockResolvedValue(serviceResult);
      const res = mockResponse();

      const result = await controller.login(dto as any, res);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        user: serviceResult.user,
      });
    });

    it('does NOT include refreshToken in returned body', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { email: 'test@example.com', role: 'user', userId: '123' },
      });
      const res = mockResponse();

      const result = await controller.login(
        { email: 'x', password: 'y' } as any,
        res,
      );

      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  // ── refreshToken ──────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('sets new refreshToken cookie and returns only accessToken', async () => {
      authService.refreshToken.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      const res = mockResponse();

      const result = await controller.refreshToken('old-refresh', res);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ accessToken: 'new-access' });
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('delegates to authService.forgotPassword and returns result', async () => {
      const expected = { message: 'Reset link sent to email' };
      authService.forgotPassword.mockResolvedValue(expected);

      const result = await controller.forgotPassword({
        email: 'test@example.com',
      } as any);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual(expected);
    });
  });

  // ── verifyResetPasswordToken ──────────────────────────────────────────────

  describe('verifyResetPasswordToken', () => {
    it('passes token to authService.verifyResetPasswordToken and returns result', async () => {
      const expected = { message: 'Token is valid' };
      authService.verifyResetPasswordToken.mockResolvedValue(expected);

      const result = await controller.verifyResetPasswordToken('reset-token');

      expect(authService.verifyResetPasswordToken).toHaveBeenCalledWith(
        'reset-token',
      );
      expect(result).toEqual(expected);
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPasswordEndpoint', () => {
    it('delegates to authService.resetPassword with token and new password', async () => {
      const expected = { message: 'Password has been successfully reset' };
      authService.resetPassword.mockResolvedValue(expected);

      const result = await controller.resetPasswordEndpoint(
        { newPassword: 'newSecure123' } as any,
        'reset-token',
      );

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'newSecure123',
      );
      expect(result).toEqual(expected);
    });
  });
});
