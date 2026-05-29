import { SetMetadata } from '@nestjs/common';
import { Roles as Role } from '../enums/roles.enum';

export const ROLES_KEY = 'roles';
/**
 * A decorator to define the roles that can access a particular route.
 * @param {Roles[]} roles An array of roles that are allowed to access the route.
 * @returns {SetMetadata} A decorator that sets the roles metadata for the route handler.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
