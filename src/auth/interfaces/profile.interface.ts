import { type Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
