import { Roles } from 'src/users/enums/roles.enum';

/**
 * Interface representing the structure of the JWT payload used for authentication and authorization.
 * It includes the user's email, unique identifier (sub), and role(s) for access control.
 */
export interface JwtPayloadInterface {
  email: string;
  sub: string;
  role: Roles | string;
}

/**
 * Interface extending JwtPayloadInterface to include additional metadata such as issued at (iat) and expiration (exp) timestamps.
 * This is useful for validating the token's validity period and ensuring that it has not expired.
 */
export interface JwtPayloadWithMetaInterface extends JwtPayloadInterface {
  iat: number;
  exp: number;
}
