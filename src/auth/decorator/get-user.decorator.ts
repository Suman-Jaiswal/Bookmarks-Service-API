import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
   const req = ctx.switchToHttp().getRequest();
   if (data) {
      return req.user[data];
   }
   return req.user;
});
