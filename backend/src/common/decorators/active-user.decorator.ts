import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { UserActiveInterface } from '../interfaces/user-active.interface';

export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: UserActiveInterface }>();
    return request.user;
  },
);
