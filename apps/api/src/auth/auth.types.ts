import type { AdminPrincipal } from "@repo/types";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  admin: AdminPrincipal;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
}
