import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@depan-express/types';

export interface CurrentUserPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
