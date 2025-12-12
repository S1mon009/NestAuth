import { Roles } from 'src/users/enums/roles.enum';

export interface JwtPayloadInterface {
  sub: string;
  email: string;
  role: Roles;
  iat: number;
  exp: number;
}
