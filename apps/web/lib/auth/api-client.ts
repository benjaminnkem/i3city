import type { AccessGrant, AdminPrincipal, LoginResult } from "@repo/types";
import { ApiError, bearer, request, requestVoid } from "@/lib/api";
import type { LoginInput } from "./schemas";

async function nullOnUnauthorized<T>(
  call: () => Promise<T>,
): Promise<T | null> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function requestLogin(input: LoginInput): Promise<LoginResult | null> {
  return nullOnUnauthorized(() =>
    request<LoginResult>({ method: "post", url: "/auth/login", data: input }),
  );
}

export function requestRefresh(
  refreshToken: string,
): Promise<AccessGrant | null> {
  return nullOnUnauthorized(() =>
    request<AccessGrant>({
      method: "post",
      url: "/auth/refresh",
      data: { refreshToken },
    }),
  );
}

export function requestLogout(refreshToken: string): Promise<void> {
  return requestVoid({
    method: "post",
    url: "/auth/logout",
    data: { refreshToken },
  });
}

export function requestProfile(
  accessToken: string,
): Promise<AdminPrincipal | null> {
  return nullOnUnauthorized(() =>
    request<AdminPrincipal>({ url: "/auth/me", ...bearer(accessToken) }),
  );
}
