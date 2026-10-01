import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { z } from "zod";
import { databaseEnvSchema, parseEnv } from "../src/config/env.js";
import { categories, products, shippingRates } from "./seed-data.js";

const seedEnv = parseEnv(
  databaseEnvSchema.extend({
    ADMIN_EMAIL: z.email().transform((email) => email.toLowerCase()),
    ADMIN_PASSWORD: z.string().min(8),
    WHATSAPP_NUMBER: z
      .string()
      .regex(/^\d{10,15}$/)
      .default("2340000000000"),
  }),
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: seedEnv.DATABASE_URL }),
});

async function seedAdmin(): Promise<void> {
  const email = seedEnv.ADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(seedEnv.ADMIN_PASSWORD, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
}

async function seedCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index },
      create: { ...category, sortOrder: index },
    });
    ids.set(category.slug, saved.id);
  }
  return ids;
}

async function seedProducts(categoryIds: Map<string, string>): Promise<void> {
  for (const { category, ...product } of products) {
    const data = { ...product, categoryId: categoryIds.get(category) ?? null };
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: data,
    });
  }
}

async function seedShipping(): Promise<void> {
  for (const rate of shippingRates) {
    await prisma.shippingRate.upsert({
      where: { state: rate.state },
      update: {},
      create: rate,
    });
  }
}

async function seedSettings(): Promise<void> {
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "i3City",
      whatsappNumber: seedEnv.WHATSAPP_NUMBER,
      supportEmail: seedEnv.ADMIN_EMAIL,
      address: "Egbeda, Ibadan, Oyo State",
      openingHours: "Monday to Saturday, 9am to 7pm",
      defaultShippingFee: 5000,
      freeShippingOver: 100000,
    },
  });
}

async function main(): Promise<void> {
  await seedAdmin();
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedShipping();
  await seedSettings();
  console.log(
    `Seeded ${categories.length} categories, ${products.length} products, ${shippingRates.length} shipping rates`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
