import { type Request } from 'express';

export interface ProfilePayload {
  userId: string;
  email: string;
  role: string;
}

export interface RequestWithProfile extends Request {
  user: ProfilePayload;
}
