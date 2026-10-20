import type { ShippingRateInfo } from "./shipping.js";
import type { PaymentMethodName } from "./orders.js";

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  brand: string | null;
  imageUrls: string[];
  featured: boolean;
  category: { name: string; slug: string } | null;
  createdAt: string;
}

export interface PublicProductDetail extends PublicProduct {
  description: string;
  related: PublicProduct[];
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface PublicSettings {
  storeName: string;
  whatsappNumber: string;
  supportEmail: string | null;
  address: string | null;
  openingHours: string | null;
  defaultShippingFee: number;
  freeShippingOver: number | null;
  paymentMethods: PaymentMethodName[];
  shippingRates: ShippingRateInfo[];
  announcements: string[];
}

export interface AdminSettings {
  storeName: string;
  whatsappNumber: string;
  supportEmail: string | null;
  address: string | null;
  openingHours: string | null;
  bankDetails: string | null;
  defaultShippingFee: number;
  freeShippingOver: number | null;
  paystackEnabled: boolean;
  paystackConfigured: boolean;
}

export const ANNOUNCEMENT_MAX_MESSAGES = 10;
export const ANNOUNCEMENT_MAX_LENGTH = 120;

export interface AnnouncementSettings {
  enabled: boolean;
  messages: string[];
}

export interface CartLineInput {
  productId: string;
  quantity: number;
  price?: number;
}

export interface ValidatedCartLine {
  productId: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
  unavailable: boolean;
  priceChanged: boolean;
  quantityAdjusted: boolean;
}

export const SHOP_SORTS = ["newest", "price-asc", "price-desc"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];
export const SHOP_PAGE_SIZE = 12;
