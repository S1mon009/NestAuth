import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Roles } from 'src/users/enums/roles.enum';
import { type UserPayload } from 'src/users/interfaces/request-with-user.interface';
import { type JwtPayloadInterface } from '../interfaces/jwt-payload.interface';

/**
 * JwtStrategy is a Passport strategy for validating JSON Web Tokens (JWT) in NestJS applications. It extends the PassportStrategy class and uses the JWT strategy from the passport-jwt library.
 * The strategy extracts the JWT from the Authorization header as a Bearer token, verifies its signature using a secret key, and validates the token's payload.
 * If the token is valid, it returns a UserPayload object containing the user's ID, email, and role for further processing in the application.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor for JwtStrategy. It initializes the strategy with specific options for extracting the JWT, ignoring expiration, and providing the secret key for verification.
   * The jwtFromRequest option specifies how to extract the JWT from the incoming request, in this case, from the Authorization header as a Bearer token.
   * The ignoreExpiration option is set to false to ensure that expired tokens are rejected.
   * The secretOrKey option retrieves the secret key from environment variables for verifying the token's signature.
   */
  constructor() {
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: (ExtractJwt as any).fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Validates the JWT payload and returns a UserPayload object.
   * @param {JwtPayloadInterface} payload The JWT payload to validate.
   * @returns {UserPayload} The validated user payload.
   */
  validate(payload: JwtPayloadInterface): UserPayload {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as Roles,
    };
  }
}
