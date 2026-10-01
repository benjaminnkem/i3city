import { z } from "zod";

const optionalString = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

const publicSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:4000/api"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: optionalString(z.string().regex(/^\d{10,15}$/)),
  NEXT_PUBLIC_CDN_URL: optionalString(z.url()),
});

const serverSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: optionalString(z.url()),
});

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function parseOrThrow<T extends z.ZodType>(
  schema: T,
  source: unknown,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

export const publicEnv = parseOrThrow(publicSchema, {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv(): z.infer<typeof serverSchema> {
  cachedServerEnv ??= parseOrThrow(serverSchema, process.env);
  return cachedServerEnv;
}
