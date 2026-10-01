export const categories = [
  { name: "Phones", slug: "phones" },
  { name: "Chargers and power banks", slug: "chargers-and-power-banks" },
  { name: "Earbuds and audio", slug: "earbuds-and-audio" },
  { name: "Smartwatches", slug: "smartwatches" },
  { name: "Cases and protection", slug: "cases-and-protection" },
  { name: "Cables and adapters", slug: "cables-and-adapters" },
];

export interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured: boolean;
}

export const products: SeedProduct[] = [
  {
    name: "Nova X5, 128GB",
    slug: "nova-x5-128gb",
    category: "phones",
    brand: "Nova",
    sku: "NOVA-X5-128",
    description:
      "6.6 inch 90Hz display, 5,000mAh battery and a 12 month warranty.",
    price: 148000,
    compareAtPrice: 165000,
    stock: 6,
    featured: true,
  },
  {
    name: "Spark 20 Pro",
    slug: "spark-20-pro",
    category: "phones",
    brand: "Spark",
    sku: "SPARK-20-PRO",
    description: "A fast everyday phone with a large battery.",
    price: 72500,
    stock: 9,
    featured: false,
  },
  {
    name: "AirPulse Pro earbuds",
    slug: "airpulse-pro-earbuds",
    category: "earbuds-and-audio",
    brand: "AirPulse",
    sku: "AIRPULSE-PRO",
    description:
      "Noise cancelling earbuds with 28 hours of battery with the case.",
    price: 22500,
    compareAtPrice: 27000,
    stock: 14,
    featured: true,
  },
  {
    name: "AirPulse Max",
    slug: "airpulse-max",
    category: "earbuds-and-audio",
    brand: "AirPulse",
    sku: "AIRPULSE-MAX",
    description: "Premium earbuds with the longest battery in the range.",
    price: 31000,
    stock: 11,
    featured: false,
  },
  {
    name: "20,000mAh power bank",
    slug: "20000mah-power-bank",
    category: "chargers-and-power-banks",
    brand: "Voltix",
    sku: "VOLTIX-PB20",
    description: "22.5W fast charging with two USB-C ports and one USB-A port.",
    price: 18900,
    stock: 0,
    featured: true,
  },
  {
    name: "65W GaN charger",
    slug: "65w-gan-charger",
    category: "chargers-and-power-banks",
    brand: "Voltix",
    sku: "VOLTIX-GAN65",
    description:
      "Charges three devices at once with two USB-C ports and one USB-A port.",
    price: 14500,
    stock: 3,
    featured: true,
  },
  {
    name: "33W fast charger",
    slug: "33w-fast-charger",
    category: "chargers-and-power-banks",
    brand: "Voltix",
    sku: "VOLTIX-FC33",
    description: "A compact wall charger for phones and earbuds.",
    price: 9800,
    stock: 25,
    featured: false,
  },
  {
    name: "Pulse Band 3",
    slug: "pulse-band-3",
    category: "smartwatches",
    brand: "Pulse",
    sku: "PULSE-BAND-3",
    description: "AMOLED display and a 14 day battery.",
    price: 27800,
    compareAtPrice: 32000,
    stock: 22,
    featured: true,
  },
  {
    name: "Armor case",
    slug: "armor-case",
    category: "cases-and-protection",
    brand: "Armor",
    sku: "ARMOR-CASE",
    description: "Drop protection with raised edges for the screen and camera.",
    price: 6500,
    stock: 40,
    featured: false,
  },
  {
    name: "Clear shock case",
    slug: "clear-shock-case",
    category: "cases-and-protection",
    brand: "Armor",
    sku: "ARMOR-CLEAR",
    description: "A clear case that absorbs shocks and resists yellowing.",
    price: 5400,
    stock: 31,
    featured: false,
  },
  {
    name: "Braided USB-C cable, 1m",
    slug: "braided-usb-c-cable-1m",
    category: "cables-and-adapters",
    brand: "Voltix",
    sku: "VOLTIX-USBC-1M",
    description: "A durable braided cable that supports fast charging.",
    price: 3200,
    stock: 60,
    featured: false,
  },
];

export interface SeedShippingRate {
  state: string;
  fee: number;
  etaDays: string;
}

const tiers: Record<string, { fee: number; etaDays: string }> = {
  local: { fee: 2000, etaDays: "1 day" },
  southwest: { fee: 3500, etaDays: "1 to 2 days" },
  central: { fee: 5500, etaDays: "3 to 4 days" },
  south: { fee: 6500, etaDays: "3 to 5 days" },
  north: { fee: 8000, etaDays: "4 to 6 days" },
};

const stateTiers: Record<string, string[]> = {
  local: ["Oyo"],
  southwest: ["Lagos", "Ogun", "Osun", "Ondo", "Ekiti"],
  central: [
    "FCT",
    "Kwara",
    "Kogi",
    "Niger",
    "Nasarawa",
    "Benue",
    "Plateau",
    "Edo",
    "Delta",
  ],
  south: [
    "Rivers",
    "Bayelsa",
    "Akwa Ibom",
    "Cross River",
    "Abia",
    "Anambra",
    "Ebonyi",
    "Enugu",
    "Imo",
  ],
  north: [
    "Kano",
    "Kaduna",
    "Katsina",
    "Jigawa",
    "Bauchi",
    "Gombe",
    "Adamawa",
    "Taraba",
    "Borno",
    "Yobe",
    "Sokoto",
    "Kebbi",
    "Zamfara",
  ],
};

export const shippingRates: SeedShippingRate[] = Object.entries(
  stateTiers,
).flatMap(([tier, states]) =>
  states.map((state) => ({ state, ...tiers[tier]! })),
);
