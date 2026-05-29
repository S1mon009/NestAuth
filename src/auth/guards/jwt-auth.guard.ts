import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard that extends the default AuthGuard provided by Passport.
 * This guard is used to protect routes that require authentication using JWT tokens.
 * It checks for the presence of a valid JWT token in the request headers and validates it.
 * If the token is valid, the request is allowed to proceed; otherwise, an unauthorized error is returned.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
