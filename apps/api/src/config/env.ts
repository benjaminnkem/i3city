import { z } from "zod";

const MIN_SECRET_LENGTH = 32;

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().startsWith("postgres", "Must be a PostgreSQL URL"),
});

const storageKeys = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

export const envSchema = databaseEnvSchema
  .extend({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    WEB_URL: z.url().default("http://localhost:3000"),
    JWT_SECRET: z.string().min(MIN_SECRET_LENGTH),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.url().optional(),
  })
  .superRefine((env, context) => {
    const missing = storageKeys.filter((key) => !env[key]);
    const configured = missing.length < storageKeys.length;
    const required = env.NODE_ENV === "production" || configured;
    if (!required) {
      return;
    }
    for (const key of missing) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: "Required when image storage is configured",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol("ENV");

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return parseEnv(envSchema, source);
}
