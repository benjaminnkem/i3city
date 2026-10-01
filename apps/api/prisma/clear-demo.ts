import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { databaseEnvSchema, parseEnv } from "../src/config/env.js";

const env = parseEnv(databaseEnvSchema);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

prisma.order
  .deleteMany({ where: { note: "demo-seed" } })
  .then((result) => console.log(`Removed ${result.count} demo orders`))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
