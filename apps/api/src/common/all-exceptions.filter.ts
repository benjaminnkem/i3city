import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiErrorBody, ApiErrorCode, ApiFailure } from "@repo/types";
import type { Response } from "express";

const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "PAYLOAD_TOO_LARGE",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE",
};

interface ErrorPayload {
  code?: ApiErrorCode;
  message?: string | string[];
  details?: ApiErrorBody["details"];
}

interface ParsedBodyError {
  status: number;
  expose?: boolean;
}

function isParsedBodyError(value: unknown): value is ParsedBodyError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "number" &&
    value.status >= 400 &&
    value.status < 500
  );
}

function codeFor(status: number): ApiErrorCode {
  return CODE_BY_STATUS[status] ?? "INTERNAL_SERVER_ERROR";
}

function messageOf(payload: ErrorPayload, fallback: string): string {
  if (Array.isArray(payload.message)) {
    return payload.message.join(", ");
  }
  return payload.message ?? fallback;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, error } = this.describe(exception);
    const body: ApiFailure = { success: false, error };
    response.status(status).json(body);
  }

  private describe(exception: unknown): {
    status: number;
    error: ApiErrorBody;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const payload: ErrorPayload =
        typeof raw === "string" ? { message: raw } : (raw as ErrorPayload);
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(exception.message, exception.stack);
      }
      return {
        status,
        error: {
          code: payload.code ?? codeFor(status),
          message: messageOf(payload, exception.message),
          ...(payload.details ? { details: payload.details } : {}),
        },
      };
    }
    if (isParsedBodyError(exception)) {
      return {
        status: exception.status,
        error: { code: codeFor(exception.status), message: "Invalid request" },
      };
    }
    this.logger.error(
      exception instanceof Error ? exception.message : "Unknown error",
      exception instanceof Error ? exception.stack : undefined,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      },
    };
  }
}
