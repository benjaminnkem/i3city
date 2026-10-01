import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { subDays, subHours } from "date-fns";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { databaseEnvSchema, parseEnv } from "../src/config/env.js";

const DEMO_NOTE = "demo-seed";
const ORDER_COUNT = 110;
const HISTORY_DAYS = 45;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const STATES = ["Lagos", "Oyo", "FCT", "Rivers", "Kano", "Ogun", "Enugu"];
const CITIES = [
  "Ikeja",
  "Ibadan",
  "Garki",
  "Port Harcourt",
  "Kano",
  "Abeokuta",
  "Enugu",
];
const NAMES = [
  "Ada Obi",
  "Tunde Bello",
  "Zainab Musa",
  "Chidi Eze",
  "Ngozi Okafor",
  "Seun Adeyemi",
  "Halima Yusuf",
  "Emeka Nwosu",
];

const env = parseEnv(databaseEnvSchema);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261001);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

function orderCode(): string {
  const suffix = Array.from({ length: 6 }, () => pick([...CODE_ALPHABET])).join(
    "",
  );
  return `I3-${suffix}`;
}

function weightedStatus(): {
  status:
    | "AWAITING_CONFIRMATION"
    | "CONFIRMED"
    | "PACKED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  paid: boolean;
} {
  const roll = random();
  if (roll < 0.08) return { status: "AWAITING_CONFIRMATION", paid: false };
  if (roll < 0.14) return { status: "CONFIRMED", paid: true };
  if (roll < 0.2) return { status: "PACKED", paid: true };
  if (roll < 0.3) return { status: "SHIPPED", paid: true };
  if (roll < 0.9) return { status: "DELIVERED", paid: true };
  return { status: "CANCELLED", paid: false };
}

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 } },
    select: { id: true, name: true, price: true, images: true },
  });
  if (products.length === 0) {
    throw new Error("Seed products first with pnpm db:seed");
  }
  await prisma.order.deleteMany({ where: { note: DEMO_NOTE } });
  const now = new Date();
  for (let index = 0; index < ORDER_COUNT; index += 1) {
    const age = Math.floor(Math.pow(random(), 1.4) * HISTORY_DAYS);
    const createdAt = subHours(subDays(now, age), Math.floor(random() * 12));
    const { status, paid } = weightedStatus();
    const lines = Array.from({ length: 1 + Math.floor(random() * 3) }, () => {
      const product = pick(products);
      return { product, quantity: 1 + Math.floor(random() * 2) };
    });
    const subtotal = lines.reduce(
      (total, line) => total + line.product.price * line.quantity,
      0,
    );
    const shippingFee =
      subtotal >= 100000 ? 0 : 3500 + Math.floor(random() * 4) * 1000;
    const stateIndex = Math.floor(random() * STATES.length);
    await prisma.order.create({
      data: {
        code: orderCode(),
        customerName: pick(NAMES),
        phone: `080${Math.floor(10000000 + random() * 89999999)}`,
        address: "12 Demo Street",
        city: CITIES[stateIndex] ?? "Ibadan",
        state: STATES[stateIndex] ?? "Oyo",
        note: DEMO_NOTE,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        paymentMethod: random() < 0.7 ? "WHATSAPP" : "PAYSTACK",
        paymentStatus: paid ? "PAID" : "UNPAID",
        status,
        paidAt: paid ? subHours(createdAt, -2) : null,
        createdAt,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            price: line.product.price,
            quantity: line.quantity,
            image: line.product.images[0] ?? null,
          })),
        },
      },
    });
  }
  console.log(`Created ${ORDER_COUNT} demo orders`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
