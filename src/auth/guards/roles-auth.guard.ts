import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../users/decorators/roles.decorator';
import { Roles } from '../../users/enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Pobieramy role wymagane dla endpointu
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      // Jeśli nie ustawiono żadnej roli, endpoint jest publiczny
      return true;
    }

    // Pobieramy użytkownika z requestu (dodane przez JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) return false;

    // Sprawdzamy, czy użytkownik ma jedną z wymaganych ról
    return requiredRoles.includes(user.role as Roles);
  }
}
