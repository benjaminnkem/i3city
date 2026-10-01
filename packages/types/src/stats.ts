export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusName = (typeof ORDER_STATUSES)[number];

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusCount {
  status: OrderStatusName;
  count: number;
}

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

export interface CategoryShare {
  name: string;
  productCount: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  imageUrl: string | null;
}

export interface OrderStats {
  today: number;
  awaitingAction: number;
  revenue7d: number;
  revenuePrev7d: number;
  revenue30d: number;
  revenuePrev30d: number;
  paidCount30d: number;
  averageOrderValue30d: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
}

export interface AdminStats {
  generatedAt: string;
  orders: OrderStats;
  products: ProductStats;
  revenueSeries: RevenuePoint[];
  orderStatus: StatusCount[];
  topProducts: TopProduct[];
  categories: CategoryShare[];
  lowStock: LowStockItem[];
}
