import { type Request } from 'express';
import { Roles } from '../enums/roles.enum';

/**
 * Defines the structure of the user payload that will be attached to the request object after authentication.
 * This interface includes the user's ID, email, and role, which can be used throughout the application to identify the user and control access to certain routes based on their role.
 */
export interface UserPayload {
  userId: string;
  email: string;
  role: Roles;
}

/**
 * Extends the Express Request interface to include a user property, which will hold the authenticated user's information.
 * This allows us to access the user's details in any route handler after the authentication middleware has processed the request and attached the user payload to it.
 */
export interface RequestWithUser extends Request {
  user: UserPayload;
}
