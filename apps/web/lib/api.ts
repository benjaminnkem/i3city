import type {
  ApiErrorBody,
  ApiErrorCode,
  ApiFailure,
  ApiSuccess,
  PaginationMeta,
} from "@repo/types";
import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_API_URL = "http://localhost:4000/api";
const REQUEST_TIMEOUT_MS = 10_000;

export type ClientErrorCode = ApiErrorCode | "NETWORK_ERROR";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly details?: ApiErrorBody["details"],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isFailure(body: unknown): body is ApiFailure {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    body.success === false &&
    "error" in body
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body: unknown = error.response?.data;
    if (isFailure(body)) {
      const { code, message, details } = body.error;
      return new ApiError(status, code, message, details);
    }
    return new ApiError(
      status,
      error.response ? "INTERNAL_SERVER_ERROR" : "NETWORK_ERROR",
      error.message,
    );
  }
  return new ApiError(0, "NETWORK_ERROR", "Unexpected error");
}

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiSuccess<T>>(config);
  return response.data.data;
}

export async function requestPage<T>(
  config: AxiosRequestConfig,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const response = await http.request<ApiSuccess<T[]>>(config);
  const { data, meta } = response.data;
  if (!meta) {
    throw new ApiError(
      response.status,
      "INTERNAL_SERVER_ERROR",
      "Response is missing pagination metadata",
    );
  }
  return { items: data, meta };
}

export async function requestVoid(config: AxiosRequestConfig): Promise<void> {
  await http.request(config);
}

export function bearer(accessToken: string): AxiosRequestConfig {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}
