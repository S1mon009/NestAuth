import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Roles } from 'src/users/enums/roles.enum';
import { type UserPayload } from 'src/users/interfaces/request-with-user.interface';
import { type JwtPayloadInterface } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: (ExtractJwt as any).fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayloadInterface): UserPayload {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as Roles,
    };
  }
}
