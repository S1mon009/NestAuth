import { type Request } from 'express';
import { Roles } from '../enums/roles.enum';

export interface UserPayload {
  userId: string;
  email: string;
  role: Roles;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
