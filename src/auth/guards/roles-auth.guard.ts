import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../users/decorators/roles.decorator';
import { Roles } from '../../users/enums/roles.enum';
import { type RequestWithUser } from 'src/users/interfaces/request-with-user.interface';

/**
 * RolesGuard is a custom guard that implements role-based access control (RBAC) in the application.
 * It checks if the user making the request has the necessary roles to access a particular route or resource.
 * The required roles are defined using the @Roles() decorator on the route handlers or controllers.
 * The guard retrieves the required roles from the metadata and compares them with the user's role.
 * If the user has one of the required roles, access is granted; otherwise, access is denied.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * The constructor injects the Reflector service, which is used to retrieve metadata about the required roles for a route.
   * The Reflector allows the guard to access the metadata defined by the @Roles() decorator on the route handlers or controllers.
   * This enables the guard to determine which roles are required for a given route and perform the necessary checks against the user's role.
   * @param {Reflector} reflector The Reflector service is injected into the RolesGuard to allow it to access metadata about the required roles for a route.
   */
  constructor(private reflector: Reflector) {}

  /**
   * Checks if the user has the required roles to access the requested route.
   * @param {ExecutionContext} context The ExecutionContext provides details about the current request being processed, including the handler and class of the route being accessed. The RolesGuard uses this context to retrieve the required roles for the route from the metadata defined by the @Roles() decorator. It then checks if the user making the request has one of the required roles to determine if access should be granted or denied.
   * @returns
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) return false;

    return requiredRoles.includes(user.role);
  }
}
