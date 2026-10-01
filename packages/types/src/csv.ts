export const PRODUCT_CSV_COLUMNS = [
  "sku",
  "name",
  "brand",
  "category",
  "price",
  "compare_at_price",
  "stock",
  "active",
  "featured",
  "description",
] as const;

export type ProductCsvColumn = (typeof PRODUCT_CSV_COLUMNS)[number];

export type ProductCsvRow = Partial<Record<ProductCsvColumn, string>>;

export const MAX_IMPORT_ROWS = 1000;

export type ImportAction = "create" | "update" | "error";

export interface ImportRowResult {
  line: number;
  action: ImportAction;
  name: string;
  sku: string | null;
  messages: string[];
}

export interface ImportResult {
  dryRun: boolean;
  summary: { create: number; update: number; error: number };
  createdCategories: string[];
  rows: ImportRowResult[];
}
