import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/rol.enum';
import { ROLES_KEY } from '../decorators/role.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.getAllAndOverride<Role>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!role) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: string } }>();
    const user = request.user;

    if (!user) return false;
    if (user.role === Role.ADMIN) return true;

    return role === (user.role as Role);
  }
}
