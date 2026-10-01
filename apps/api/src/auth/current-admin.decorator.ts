import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AdminPrincipal } from "@repo/types";
import type { AuthenticatedRequest } from "./auth.types.js";

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminPrincipal =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().admin,
);
