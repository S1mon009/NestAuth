import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  ApiBody,
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Cookies } from './decorators/cookies.decorator';
import {
  RegisterResponseDto,
  RegisterDto,
  LoginDto,
  LoginResponseDto,
  LoginServiceResponseDto,
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ForgotPasswordResponseDto,
  VerifyResetPasswordTokenResponseDto,
  ResetPasswordResponseDto,
  VerifyEmailResponseDto,
} from './dto';

@ApiTags('Authentication')
@ApiInternalServerErrorResponse({
  description: 'Server error',
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Endpoint to register a new user with email and password',
  })
  @ApiBody({ type: RegisterDto, description: 'User registration data' })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or user already exists',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto.email, dto.password);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email',
    description:
      'Endpoint to verify user email using token sent to their email address',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Verification token sent to user email',
  })
  @ApiOkResponse({
    description: 'Email successfully verified',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
  })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<VerifyEmailResponseDto> {
    return await this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Endpoint to authenticate user and return access token, basic user info, and set refresh token in cookie',
  })
  @ApiBody({ type: LoginDto, description: 'User login data' })
  @ApiOkResponse({
    description: 'User successfully logged in',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result: LoginServiceResponseDto = await this.authService.login(
      dto.email,
      dto.password,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<boolean>('COOKIE_SECURE') || false,
      sameSite:
        this.configService.get<boolean | 'strict' | 'lax' | 'none' | undefined>(
          'COOKIE_SAME_SITE',
        ) || 'strict',
      maxAge:
        this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN') ||
        1000000000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token (cookie)',
    description:
      'Endpoint to refresh access token using refresh token stored in cookie',
  })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    description: 'Access token refreshed',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResponseDto> {
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<boolean>('COOKIE_SECURE') || false,
      sameSite:
        this.configService.get<boolean | 'strict' | 'lax' | 'none' | undefined>(
          'COOKIE_SAME_SITE',
        ) || 'strict',
      maxAge:
        this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN') ||
        1000000000,
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Endpoint to request a password reset email',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Email for password reset request',
  })
  @ApiOkResponse({
    description: 'Password reset email sent',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify reset password token',
    description: 'Endpoint to verify the reset password token',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Reset password token sent to user email',
  })
  @ApiOkResponse({
    description: 'Token is valid',
    type: VerifyResetPasswordTokenResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
  })
  async verifyResetPasswordToken(
    @Query('token') token: string,
  ): Promise<VerifyResetPasswordTokenResponseDto> {
    return this.authService.verifyResetPasswordToken(token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset user password',
    description:
      'Endpoint to reset user password using valid reset token and new password',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'New password for resetting',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Reset password token sent to user email',
  })
  @ApiOkResponse({
    description: 'Password successfully reset',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or password',
  })
  async resetPasswordEndpoint(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(token, dto.newPassword);
  }
}
