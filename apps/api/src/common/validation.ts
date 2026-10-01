import { BadRequestException, ValidationPipe } from "@nestjs/common";
import type { ApiErrorDetail } from "@repo/types";
import type { ValidationError } from "class-validator";

function flatten(errors: ValidationError[], parent = ""): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: flatten(errors),
      }),
  });
}
