import {
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
} from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { paginate } from "./paginated.js";
import { ResponseInterceptor } from "./response.interceptor.js";

function run(value: unknown): Promise<unknown> {
  const handler: CallHandler = { handle: () => of(value) };
  return firstValueFrom(
    new ResponseInterceptor().intercept({} as ExecutionContext, handler),
  );
}

describe("ResponseInterceptor", () => {
  it("wraps plain values", async () => {
    await expect(run({ id: 1 })).resolves.toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  it("wraps paginated results with meta", async () => {
    await expect(run(paginate(["a", "b"], 5, 1, 2))).resolves.toEqual({
      success: true,
      data: ["a", "b"],
      meta: { page: 1, limit: 2, total: 5, totalPages: 3 },
    });
  });

  it("passes file downloads through untouched", async () => {
    const file = new StreamableFile(Buffer.from("a,b"));
    await expect(run(file)).resolves.toBe(file);
  });

  it("leaves empty responses empty", async () => {
    await expect(run(undefined)).resolves.toBeUndefined();
  });
});
