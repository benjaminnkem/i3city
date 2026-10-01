import type { INestApplication } from "@nestjs/common";
import helmet from "helmet";
import { createValidationPipe } from "./common/validation.js";
import { ENV, type Env } from "./config/env.js";

export function configureApp(app: INestApplication): void {
  const env = app.get<Env>(ENV);
  const express = app.getHttpAdapter().getInstance() as {
    set: (name: string, value: unknown) => void;
  };
  express.set("trust proxy", 1);
  app.use(helmet());
  app.setGlobalPrefix("api");
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({ origin: env.WEB_URL, credentials: true });
  app.enableShutdownHooks();
}
