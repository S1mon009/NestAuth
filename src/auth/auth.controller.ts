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
import { Throttle, SkipThrottle } from '@nestjs/throttler';
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
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
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

/**
 * Controller for handling authentication-related endpoints such as registration, login, email verification, password reset, and token refresh. This controller interacts with the AuthService to perform the necessary business logic and returns appropriate responses based on the outcome of each operation.
 * @remarks The controller includes rate limiting on certain endpoints to prevent abuse, and uses Swagger decorators to document the API for better developer experience.
 */
@ApiTags('Authentication')
@ApiInternalServerErrorResponse({
  description: 'An unexpected error occurred while processing the request',
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  /**
   * Creates an instance of the AuthController.
   * @param {AuthService} authService The authentication service that contains the business logic for handling user registration, login, email verification, password reset, and token refresh operations. This service is injected into the controller to allow it to delegate the actual processing of authentication-related tasks.
   * @param {ConfigService} configService The configuration service that provides access to application configuration values.
   */
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user.
   * @param {RegisterDto} dto User registration data.
   * @returns {Promise<RegisterResponseDto>} A promise resolving to the registration response.
   * @throws {BadRequestException} If the input data is invalid or the user already exists.
   * @throws {TooManyRequestsException} If there are too many registration attempts.
   * @remarks This endpoint is throttled to prevent abuse, allowing a maximum of 3 registration attempts per hour. Upon successful registration, a verification email is sent to the user.
   * @example
   * // Request URL
   * POST /auth/register
   * // Request body
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123"
   * }
   * // Successful response
   * Status: 201 Created
   * {
   *   "message": "User registered successfully, verification email sent"
   * }
   * // Error response for invalid input
   * Status: 400 Bad Request
   * {
   *   "statusCode": 400,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/auth/register",
   *   "message": "Email already exists"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/forgot-password",
   *  "message": "Too many password reset requests. Please try again later."
   * }
   */
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Endpoint to register a new user with email and password and sends verification email',
  })
  @ApiBody({ type: RegisterDto, description: 'User registration data' })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or user already exists',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts. Please try again later.',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto.email, dto.password);
  }

  /**
   * Verifies a user's email address using a token.
   * @param {string} token The verification token sent to the user's email address.
   * @returns {Promise<VerifyEmailResponseDto>} A promise resolving to the email verification response.
   * @throws {BadRequestException} If the user is not found or the token is invalid/expired.
   * @throws {ConflictException} If the email is already verified.
   * @remarks This endpoint is not throttled to allow users to verify their email without restrictions. The token is typically sent to the user's email address upon registration, and this endpoint validates the token to confirm the user's email.
   * @example
   * // Request URL
   * GET /auth/verify-email?token=verification-token-123
   * // Successful response
   * Status: 200 OK
   * {
   *   "status": "VERIFIED"
   * }
   * or an HTML page indicating successful verification in your frontend application.
   * // Error response for invalid token
   * Status: 409 Conflict
   * {
   *  "statusCode": 409,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/verify-email?token=<token>",
   *  "message": "Email address has already been verified"
   *}
   * // Error response for user not found or invalid token
   * Status: 400 Bad Request
   * {
   *  "statusCode": 400,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/verify-email?token=<token>",
   * "message": "User not found for provided token"
   * }
   */
  @SkipThrottle()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
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
    description: 'User not found or invalid/expired token',
  })
  @ApiConflictResponse({
    description: 'Email already verified',
    type: VerifyEmailResponseDto,
  })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<VerifyEmailResponseDto> {
    return await this.authService.verifyEmail(token);
  }

  /**
   * Authenticates a user and returns an access token, basic user info, and sets a refresh token in an HTTP-only cookie.
   * @param {LoginDto} dto User login data containing email and password.
   * @param {Response} res The response object used to set the refresh token cookie.
   * @returns {Promise<LoginResponseDto>} A promise resolving to the login response containing the access token and user info.
   * @throws {UnauthorizedException} If the provided credentials are invalid.
   * @throws {BadRequestException} If the request body is invalid.
   * @throws {TooManyRequestsException} If there are too many login attempts.
   * @remarks This endpoint is throttled to allow a maximum of 5 login attempts per minute to prevent brute-force attacks. Upon successful authentication, an access token is returned in the response body, and a refresh token is set in an HTTP-only cookie for maintaining user sessions.
   * @example
   * // Request URL
   * POST /auth/login
   * // Request body
   * {
   *   "email": "user@example.com",
   *   "password": "secure-password"
   * }
   * // Successful response
   * Status: 200 OK
   * {
   *   "accessToken": "<token>",
   *   "user": {
   *     "email": "<email>",
   *     "role": "<user | admin>",
   *     "userId": "<user_id>"
   *   }
   * }
   * And refresh token is set in an HTTP-only cookie named 'refreshToken'.
   * // Error response for invalid credentials
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/auth/login",
   *   "message": "Email not verified"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/forgot-password",
   *  "message": "Too many password reset requests. Please try again later."
   * }
   */
  @Throttle({ short: { limit: 5, ttl: 60000 } })
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
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts. Please try again later.',
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

  /**
   * Refreshes the access token using the refresh token stored in the cookie.
   * @param {string} refreshToken The refresh token extracted from the cookie.
   * @param {Response} res The response object used to set the new refresh token cookie.
   * @returns {Promise<RefreshTokenResponseDto>} A promise resolving to the refresh token response.
   * @throws {UnauthorizedException} If the refresh token is invalid or expired.
   * @remarks This endpoint is not throttled to allow users to refresh their access token without restrictions. The refresh token is expected to be sent in an HTTP-only cookie, and upon successful validation, a new access token is returned in the response body, and a new refresh token is set in the cookie.
   * @example
   * // Request URL
   * POST /auth/refresh-token
   * // Request headers include the refresh token cookie
   * Cookie: refreshToken=<refresh-token>
   * // Successful response
   * Status: 200 OK
   * {
   *   "accessToken": "<new-access-token>"
   * }
   * And a new refresh token is set in the HTTP-only cookie named 'refreshToken'.
   * // Error response for invalid refresh token
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/auth/refresh-token",
   *   "message": "Invalid refresh token"
   * }
   */
  @SkipThrottle()
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

  /**
   * Requests a password reset email to be sent to the user.
   * @param {ForgotPasswordDto} dto The DTO containing the user's email.
   * @returns {Promise<ForgotPasswordResponseDto>} A promise resolving to the response indicating the password reset email has been sent.
   * @throws {BadRequestException} If the email is invalid or not associated with any user.
   * @throws {TooManyRequestsException} If there are too many password reset requests.
   * @remarks This endpoint is throttled to allow a maximum of 3 password reset requests per hour to prevent abuse. Upon successful request, an email with a password reset token is sent to the user's email address.
   * @example
   * // Request URL
   * POST /auth/forgot-password
   * // Request body
   * {
   *   "email": "user@example.com"
   * }
   * // Successful response
   * Status: 200 OK
   * {
   *   "message": "Reset link sent to email "
   * }
   * // Error response for invalid email
   * Status: 400 Bad Request
   * {
   *  "statusCode": 400,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/forgot-password",
   *  "message": "Invalid email"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/forgot-password",
   *  "message": "Too many password reset requests. Please try again later."
   * }
   */
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
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
  @ApiTooManyRequestsResponse({
    description: 'Too many password reset requests. Please try again later.',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Verifies the reset password token.
   * @param {string} token The reset password token.
   * @returns {Promise<VerifyResetPasswordTokenResponseDto>} A promise resolving to the response indicating the token is valid.
   * @throws {BadRequestException} If the token is invalid or expired.
   * @remarks This endpoint is not throttled to allow users to verify their reset password token without restrictions. The token is typically sent to the user's email address upon requesting a password reset, and this endpoint validates the token to confirm its validity before allowing the user to reset their password.
   * @example
   * // Request URL
   * POST /auth/verify-reset-password?token=reset-token-123
   * // Successful response
   * Status: 200 OK
   * {
   *   "message": "Token is valid."
   * }
   * // Error response for invalid or expired token
   * Status: 400 Bad Request
   * {
   *  "statusCode": 400,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/verify-reset-password",
   *  "message": "Invalid or expired token"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/verify-reset-password",
   *  "message": "User not found"
   * }
   */
  @SkipThrottle()
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

  /**
   * Resets the user's password using a valid reset token.
   * @param {ResetPasswordDto} dto The data transfer object containing the new password.
   * @param {string} token The reset password token.
   * @returns {Promise<ResetPasswordResponseDto>} A promise resolving to the response indicating the password was successfully reset.
   * @throws {BadRequestException} If the token is invalid or the new password is invalid.
   * @remarks This endpoint is throttled to allow a maximum of 5 password reset attempts per 15 minutes to prevent abuse. The token is typically sent to the user's email address upon requesting a password reset, and this endpoint validates the token and updates the user's password if the token is valid.
   * @example
   * // Request URL
   * POST /auth/reset-password?token=reset-token-123
   * // Request body
   * {
   *   "newPassword": "newPassword123"
   * }
   * // Successful response
   * Status: 200 OK
   * {
   *  "message": "Password successfully reset"
   * }
   * // Error response for invalid token or password
   * Status: 400 Bad Request
   * {
   *  "statusCode": 400,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/reset-password",
   *  "message": "Invalid token or password"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/reset-password",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/reset-password",
   *  "message": "Too many password reset attempts. Please try again later."
   * }
   */
  @Throttle({ short: { limit: 5, ttl: 900000 } })
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
  @ApiTooManyRequestsResponse({
    description: 'Too many password reset attempts. Please try again later.',
  })
  async resetPasswordEndpoint(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(token, dto.newPassword);
  }
}
