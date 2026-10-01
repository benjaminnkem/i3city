import type { INestApplication } from "@nestjs/common";
import helmet from "helmet";
import { createValidationPipe } from "./common/validation.js";

export function configureApp(app: INestApplication): void {
  app.use(helmet());
  app.setGlobalPrefix("api");
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });
  app.enableShutdownHooks();
}
