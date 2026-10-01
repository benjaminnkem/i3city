import type { PaginationMeta } from "@repo/types";
import type { AxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { ApiError, http, request, requestPage, requestVoid } from "@/lib/api";

async function withAuthorization(
  config: AxiosRequestConfig,
): Promise<AxiosRequestConfig> {
  const session = await getSession();
  if (!session || session.error) {
    await signOut({ callbackUrl: "/admin/login" });
    throw new ApiError(401, "UNAUTHORIZED", "Your session has expired");
  }
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  };
}

export async function adminRequest<T>(config: AxiosRequestConfig): Promise<T> {
  return request<T>(await withAuthorization(config));
}

export async function adminRequestVoid(
  config: AxiosRequestConfig,
): Promise<void> {
  return requestVoid(await withAuthorization(config));
}

export async function adminRequestPage<T>(
  config: AxiosRequestConfig,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  return requestPage<T>(await withAuthorization(config));
}

export async function adminBlob(config: AxiosRequestConfig): Promise<Blob> {
  const authorized = await withAuthorization({
    ...config,
    responseType: "blob",
  });
  const response = await http.request<Blob>(authorized);
  return response.data;
}
