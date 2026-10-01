import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { databaseUrl } from "../src/prisma/database-url.js";
import { categories, products, shippingRates } from "./seed-data.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl() }),
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

async function seedAdmin(): Promise<void> {
  const email = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const passwordHash = await bcrypt.hash(requiredEnv("ADMIN_PASSWORD"), 12);
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
      whatsappNumber: process.env.WHATSAPP_NUMBER ?? "2340000000000",
      supportEmail: process.env.ADMIN_EMAIL ?? null,
      address: "Egbeda, Ibadan, Oyo State",
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
