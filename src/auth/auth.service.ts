import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import {
  RegisterResponseDto,
  VerifyEmailResponseDto,
  VerifyEmailStatus,
  LoginServiceResponseDto,
  RefreshTokenServiceResponseDto,
  ForgotPasswordResponseDto,
  VerifyResetPasswordTokenResponseDto,
  ResetPasswordResponseDto,
} from './dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Profile, ProfileDocument } from '../users/schemas/profile.schema';
import type {
  JwtPayloadInterface,
  JwtPayloadWithMetaInterface,
} from './interfaces/jwt-payload.interface';

/**
 * AuthService handles user authentication, including registration, email verification, login, token refreshing, and password reset. It interacts with the User and Profile models, manages JWT tokens, and emits events for logging purposes.
 * Key functionalities:
 * - register: Creates a new user, sends a verification email, and logs the registration event.
 * - verifyEmail: Verifies the user's email using a token and updates the user's verification status.
 * - validateUser: Validates user credentials during login.
 * - login: Authenticates the user, generates access and refresh tokens, and logs the login event.
 * - refreshToken: Validates the old refresh token, generates new tokens, and logs the token refresh event.
 * - forgotPassword: Generates a reset password token, sends a reset email, and logs the event.
 * - verifyResetPasswordToken: Validates the reset password token and logs the event.
 * - resetPassword: Resets the user's password using a valid token and logs the event.
 * The service uses bcrypt for password hashing, JWT for token management, and emits events for logging important actions and potential issues.
 * Error handling is implemented to provide meaningful responses for various failure scenarios, such as existing email during registration, invalid credentials during login, and token-related issues.
 * Overall, AuthService is a critical component for managing user authentication and security in the application.
 */
@Injectable()
export class AuthService {
  /**
   * Constructor for AuthService, injecting necessary dependencies including Mongoose models for User and Profile, JWT service for token management, Email service for sending emails, Config service for accessing configuration values, and Event emitter for logging events.
   * @param userModel Mongoose model representing the user entity.
   * @param profileModel Mongoose model representing the user profile entity.
   * @param jwtService Service responsible for generating and verifying JWT tokens.
   * @param emailService Service used to send email messages.
   * @param configService Service providing application configuration and environment variables.
   * @param eventEmitter Event emitter used to log business-related events.
   */
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}
  /**
   * Registers a new user with the provided email and password. The method performs several steps to ensure a secure and complete registration process. It first checks if the email is already associated with an existing user, throwing an error if it is. If the email is unique, it hashes the password using bcrypt before saving the new user to the database. After creating the user, it also creates a related profile for the user. A verification token is generated using JWT, which is then sent to the user's email address for account activation. Throughout the process, relevant events are emitted for logging purposes, such as when a registration attempt is made with an existing email, when a new user is registered, and when a verification email is sent.
   *
   * @param {string} email The user's email address. It must be unique and will be used for login and communication.
   * @param {string} password The user's password, which will be securely hashed before being stored in the database.
   * @returns {Promise<RegisterResponseDto>} A promise that resolves to a RegisterResponseDto indicating the success of the registration process and that a verification email has been sent.
   * @throws BadRequestException - Thrown when a user with the provided email already exists.
   */
  async register(
    email: string,
    password: string,
  ): Promise<RegisterResponseDto> {
    const existingUser: UserDocument | null = await this.userModel.findOne({
      email,
    });
    if (existingUser) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: `Registration attempt with existing email: ${email}`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/register`,
      });

      throw new BadRequestException('Email already exists');
    }

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    const user = new this.userModel({ email, password: hashedPassword });
    await user.save();

    const profile: ProfileDocument | null = new this.profileModel({
      userId: user._id,
    });
    await profile.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `User registered: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/register`,
      userId: user.id,
    });

    const verificationToken: string = await this.jwtService.signAsync(
      { sub: user._id.toString(), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
      },
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Send verification email to: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/register`,
      userId: user.id,
    });

    return {
      message: 'User registered successfully, verification email sent',
    };
  }

  /**
   * Verifies the user's email address using a provided token. The method first validates the JWT token to ensure it is valid and has not expired. It then retrieves the user associated with the token from the database. If the user does not exist, a NotFoundException is thrown. If the user's email has already been verified, a ConflictException is thrown to indicate that the email address has already been verified. If the token is valid and the user exists but has not yet been verified, the method updates the user's verification status to true and saves the changes to the database. Throughout the process, relevant events are emitted for logging purposes, such as when a user is successfully verified or when an attempt is made to verify an already verified email address. Finally, the method returns an object indicating the verification status of the email address.
   *
   * @param {string} token Verification token received during the account activation process.
   * @returns {Promise<VerifyEmailResponseDto>} A promise that resolves to a VerifyEmailResponseDto indicating the status of the email verification process.
   * @throws {NotFoundException} Thrown when the user referenced by the token does not exist.
   * @throws {ConflictException} Thrown when the email address has already been verified.
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    const payload: JwtPayloadWithMetaInterface = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );

    if (!user) {
      this.eventEmitter.emit('log.create', {
        type: 'error',
        description: `User not found for provided token`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/verify-email?token=${token}`,
      });

      throw new NotFoundException({
        error: `${VerifyEmailStatus.INVALID_OR_EXPIRED_TOKEN}`,
        message: 'User not found for provided token',
      });
    }
    if (user.isVerified) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: `User already verified: ${user.email}`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/verify-email?token=${token}`,
        userId: user.id,
      });

      throw new ConflictException({
        error: `${VerifyEmailStatus.ALREADY_VERIFIED}`,
        message: 'Email address has already been verified',
      });
    }

    user.isVerified = true;
    await user.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `User verified: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/verify-email?token=${token}`,
      userId: user.id,
    });

    return { status: VerifyEmailStatus.VERIFIED };
  }

  /**
   * Validates user credentials during the login process. The method takes an email and password as input and attempts to find a user with the provided email in the database. If no user is found, an UnauthorizedException is thrown indicating invalid credentials. If a user is found, the method then compares the provided password with the stored hashed password using bcrypt. If the passwords do not match, an UnauthorizedException is thrown. Additionally, if the user's email has not been verified, an UnauthorizedException is thrown indicating that the email has not been verified. If all checks pass, the method
   * @param {string} email The email address of the user to validate.
   * @param {string} password The plaintext password provided by the user for validation.
   * @returns {Promise<UserDocument>} A promise that resolves to the validated user document.
   * @throws {UnauthorizedException} Thrown when the email does not exist, the password is incorrect, or the email has not been verified.
   * The method ensures that only users with valid credentials and verified email addresses can successfully log in, providing a secure authentication mechanism for the application.
   */
  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user: UserDocument | null = await this.userModel.findOne({
      email: email,
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches: boolean = await bcrypt.compare(
      password,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new UnauthorizedException('Email not verified');

    return user;
  }

  /**
   * Logs in a user with the provided email and password. The method first validates the user's credentials using the validateUser method. If the credentials are valid, it generates a JWT access token and a refresh token for the user. The access token contains the user's email, ID, and role, and is signed with a secret key and an expiration time. The refresh token is also signed with a different secret key and has its own expiration time. The refresh token is hashed using bcrypt before being stored in the database for security purposes. After successfully logging in, the method emits an event to log the login action and returns an object containing the access token, refresh token, and user information.
   * @param {string} email The email address of the user to log in.
   * @param {string} password The plaintext password provided by the user for validation.
   * @returns {Promise<LoginServiceResponseDto>} A promise that resolves to the login response containing tokens and user information.
   * @throws {UnauthorizedException} Thrown when the email does not exist, the password is incorrect, or the email has not been verified.
   */
  async login(
    email: string,
    password: string,
  ): Promise<LoginServiceResponseDto> {
    const user: UserDocument = await this.validateUser(email, password);
    const payload: JwtPayloadInterface = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken: string = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken: string = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn:
        this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const refreshTokenHash: string = await bcrypt.hash(
      refreshToken,
      saltRounds,
    );

    user.refreshToken = refreshTokenHash;
    await user.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `User logged in: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/login`,
      userId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        role: user.role,
        userId: user._id.toString(),
      },
    };
  }

  /**
   * Refreshes the access token using the provided refresh token. The method first verifies the refresh token to ensure it is valid and has not expired. It then retrieves the user associated with the token from the database. If the user does not exist or does not have a refresh token stored, an UnauthorizedException is thrown. The method then compares the provided refresh token with the stored hashed refresh token using bcrypt. If they do not match, an UnauthorizedException is thrown. If the refresh token is valid, new access and refresh tokens are generated for the user. The new refresh token is hashed and stored in the database, replacing the old one. Finally, an event is emitted to log the token refresh action, and an object containing the new access and refresh tokens is returned.
   * @param {string} oldRefreshToken The refresh token to be used for refreshing the access token.
   * @returns {Promise<RefreshTokenServiceResponseDto>} A promise that resolves to the response containing the new access and refresh tokens.
   * @throws {UnauthorizedException} Thrown when the refresh token is invalid or has expired.
   */
  async refreshToken(
    oldRefreshToken: string,
  ): Promise<RefreshTokenServiceResponseDto> {
    const payload: JwtPayloadWithMetaInterface = this.jwtService.verify(
      oldRefreshToken,
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );

    if (!user || !user.refreshToken) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: 'Invalid refresh token',
        path: `${this.configService.get<string>('API_VERSION')}/auth/refresh-token`,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);

    if (!isMatch) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: 'Invalid refresh token',
        path: `${this.configService.get<string>('API_VERSION')}/auth/refresh-token`,
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload: JwtPayloadInterface = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken: string = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken: string = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN'),
    });

    const saltRounds: number = Number(
      this.configService.get<number>('BCRYPT_SALT') || 10,
    );
    const refreshTokenHash: string = await bcrypt.hash(
      refreshToken,
      saltRounds,
    );

    user.refreshToken = refreshTokenHash;
    await user.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Refresh token used to refresh access token for user: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/refresh-token`,
      userId: user.id,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Handles the forgot password process for a user. The method takes an email address as input and attempts to find a user with that email in the database. If no user is found, a NotFoundException is thrown. If a user is found, a reset token is generated using JWT, which includes the user's ID and email as payload. The token is signed with a secret key and has an expiration time defined in the configuration. The method then sends an email to the user containing the reset token, allowing them to reset their password. An event is emitted to log the action of sending the reset password link, and finally, a response indicating that the reset link has been sent to the email is returned.
   * @param {string} email The email address of the user who has forgotten their password. The method will attempt to find a user with this email address in the database. If no user is found, a NotFoundException is thrown. If a user is found, a reset token is generated using JWT, which includes the user's ID and email as payload. The token is signed with a secret key and has an expiration time defined in the configuration. The method then sends an email to the user containing the reset token, allowing them to reset their password. An event is emitted to log the action of sending the reset password link, and finally, a response indicating that the reset link has been sent to the email is returned.
   * @returns {Promise<ForgotPasswordResponseDto>} A promise that resolves to a ForgotPasswordResponseDto indicating the status of the forgot password process.
   * @throws {NotFoundException} Thrown when no user is found with the provided email address.
   * The method ensures that users can initiate a password reset process securely by generating a time-limited token and sending it to their registered email address, while also providing appropriate logging for monitoring and debugging purposes. For full functionality you need to add FRONTEND_URL in your .env file, and on your frontend add auth/reset-password? path with token query parameter to handle the reset password process using the token sent to the user's email.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user: UserDocument | null = await this.userModel.findOne({ email });
    if (!user) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: `User not found: ${email}`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/reset-password`,
      });
      throw new NotFoundException('User not found');
    }

    const resetToken: string = await this.jwtService.signAsync(
      { sub: user._id.toString(), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          this.configService.get<number>('JWT_RESET_PASSWORD_EXPIRES_IN') ||
          '15m',
      },
    );

    await this.emailService.sendResetPasswordEmail(user.email, resetToken);

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Reset password link sent to user: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/reset-password`,
      userId: user.id,
    });

    return { message: 'Reset link sent to email' };
  }

  /**
   * Verifies the reset password token for a user. The method takes a reset password token as input and attempts to verify it using the JWT service. If the token is valid, it retrieves the user associated with the token from the database. If no user is found, a NotFoundException is thrown. If a user is found, an event is emitted to log that a user was found for the reset password token, and a response indicating that the token is valid is returned. This method ensures that only valid tokens can be used for resetting passwords and provides appropriate logging for monitoring and debugging purposes.
   * @param {string} token The reset password token to verify.
   * @returns {Promise<VerifyResetPasswordTokenResponseDto>} A promise that resolves to a VerifyResetPasswordTokenResponseDto indicating the status of the token verification.
   * @throws {NotFoundException} Thrown when no user is found with the provided token.
   */
  async verifyResetPasswordToken(
    token: string,
  ): Promise<VerifyResetPasswordTokenResponseDto> {
    const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );
    if (!user) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: `User not found for reset password token`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/verify-reset-password?token=${token}`,
      });
      throw new NotFoundException('User not found');
    }

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `User found for reset password token`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/verify-reset-password?token=${token}`,
    });

    return { message: 'Token is valid' };
  }

  /**
   * Resets the password for a user using a valid reset token. The method takes a reset password token and a new password as input. It first verifies the token using the JWT service to ensure it is valid and has not expired. If the token is valid, it retrieves the user associated with the token from the database. If no user is found, a NotFoundException is thrown. If a user is found, the method hashes the new password using bcrypt and updates the user's password in the database. An event is emitted to log that the password has been successfully reset for the user, and a response indicating that the password reset was successful is returned. This method ensures that only users with valid tokens can reset their passwords and provides appropriate logging for monitoring and debugging purposes.
   * @param {string} token The reset password token.
   * @param {string} newPassword The new password for the user.
   * @returns {Promise<ResetPasswordResponseDto>} A promise that resolves to a ResetPasswordResponseDto indicating the status of the password reset process.
   * @throws {NotFoundException} Thrown when no user is found with the provided token.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponseDto> {
    const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    const user: UserDocument | null = await this.userModel.findById(
      payload.sub,
    );
    if (!user) {
      this.eventEmitter.emit('log.create', {
        type: 'warning',
        description: `User not found for reset password token`,
        path: `${this.configService.get<string>('API_VERSION')}/auth/reset-password?token=${token}`,
      });

      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Password has been successfully reset for user: ${user.email}`,
      path: `${this.configService.get<string>('API_VERSION')}/auth/reset-password?token=${token}`,
      userId: user.id,
    });

    return { message: 'Password has been successfully reset' };
  }
}
