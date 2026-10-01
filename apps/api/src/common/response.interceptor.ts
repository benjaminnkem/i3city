import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  StreamableFile,
  type NestInterceptor,
} from "@nestjs/common";
import type { ApiSuccess } from "@repo/types";
import { map, type Observable } from "rxjs";
import { Paginated } from "./paginated.js";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccess<unknown> | StreamableFile | undefined> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined) {
          return undefined;
        }
        if (value instanceof StreamableFile) {
          return value;
        }
        if (value instanceof Paginated) {
          return { success: true, data: value.items, meta: value.meta };
        }
        return { success: true, data: value };
      }),
    );
  }
}
