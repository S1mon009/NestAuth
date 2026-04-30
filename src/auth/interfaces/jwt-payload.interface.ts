import { Roles } from 'src/users/enums/roles.enum';

export interface JwtPayloadInterface {
  email: string;
  sub: string;
  role: Roles | string;
}

export interface JwtPayloadWithMetaInterface extends JwtPayloadInterface {
  iat: number;
  exp: number;
}
