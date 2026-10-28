import { formatNaira, type PublicProductDetail } from "@repo/types";
import type { Metadata } from "next";
import type { ShopParams } from "@/lib/store/api";
import { shopQueryString } from "@/lib/store/shop-params";
import { SITE_NAME, trimDescription } from "./site";

const TITLE_LIMIT = 60 - ` | ${SITE_NAME}`.length;
const DELIVERY_LINE =
  "Delivery to every state in Nigeria. Order on WhatsApp or pay by card.";

export function fitTitle(text: string, limit = TITLE_LIMIT): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit + 1);
  const space = cut.lastIndexOf(" ");
  return (space > limit / 2 ? cut.slice(0, space) : cut.slice(0, limit)).trim();
}

export function productTitle(name: string): string {
  const full = `${name} Price in Nigeria`;
  return full.length <= TITLE_LIMIT ? full : fitTitle(name);
}

export function productDescription(product: PublicProductDetail): string {
  const lead = `Buy ${product.name} for ${formatNaira(product.price)} at ${SITE_NAME}.`;
  const detail = product.description.replace(/\s+/g, " ").trim();
  const text = detail ? `${lead} ${detail}` : lead;
  return trimDescription(text.length < 120 ? `${text} ${DELIVERY_LINE}` : text);
}

export function productKeywords(product: PublicProductDetail): string[] {
  return [
    product.name,
    `${product.name} price in Nigeria`,
    ...(product.brand ? [product.brand] : []),
    ...(product.category ? [product.category.name] : []),
  ];
}

export function categoryTitle(name: string, page: number): string {
  const base = fitTitle(`Buy ${name} in Nigeria`, TITLE_LIMIT - 8);
  return page > 1 ? `${base}, Page ${page}` : base;
}

export function categoryDescription(name: string, count: number): string {
  const lower = name.toLowerCase();
  const lead =
    count > 0
      ? `Shop ${count} ${lower} at ${SITE_NAME}.`
      : `Shop ${lower} at ${SITE_NAME}.`;
  return trimDescription(
    `${lead} Prices in naira, delivery to every state in Nigeria and easy ordering on WhatsApp.`,
  );
}

export function isFilteredView(params: ShopParams): boolean {
  return Boolean(
    params.search ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined ||
    params.inStock ||
    (params.sort && params.sort !== "newest"),
  );
}

const NOINDEX: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

export function listingCanonical(basePath: string, params: ShopParams): string {
  if (isFilteredView(params)) {
    return `${basePath}${shopQueryString(params)}`;
  }
  const page = params.page ?? 1;
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export function filteredRobots(params: ShopParams): Pick<Metadata, "robots"> {
  return isFilteredView(params) ? { robots: NOINDEX } : {};
}
