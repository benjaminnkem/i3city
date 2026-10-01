import {
  MAX_IMPORT_ROWS,
  PRODUCT_CSV_COLUMNS,
  type ImportResult,
  type ProductCsvColumn,
  type ProductCsvRow,
} from "@repo/types";
import { format } from "date-fns";
import Papa from "papaparse";
import { adminBlob, adminRequest } from "./client";

const REQUIRED_COLUMNS: ProductCsvColumn[] = ["name", "price"];

const SAMPLE_ROW = [
  "VOLTIX-GAN65",
  "65W GaN charger",
  "Voltix",
  "Chargers and power banks",
  "14500",
  "",
  "12",
  "true",
  "false",
  "Charges three devices at once.",
];

function normaliseHeader(header: string): string {
  return header
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function templateCsv(): string {
  return Papa.unparse({
    fields: [...PRODUCT_CSV_COLUMNS],
    data: [SAMPLE_ROW],
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadTemplate(): void {
  downloadBlob(
    new Blob([templateCsv()], { type: "text/csv;charset=utf-8" }),
    "products-template.csv",
  );
}

export async function exportProducts(): Promise<void> {
  const blob = await adminBlob({ url: "/admin/products/export" });
  downloadBlob(blob, `products-${format(new Date(), "yyyy-MM-dd")}.csv`);
}

export function parseProductsCsv(file: File): Promise<ProductCsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: normaliseHeader,
      complete: ({ data, meta }) => {
        const present = new Set(meta.fields ?? []);
        const missing = REQUIRED_COLUMNS.filter(
          (column) => !present.has(column),
        );
        if (missing.length > 0) {
          reject(
            new Error(
              `Your file needs these columns: ${missing.join(", ")}. Download the template to see the format.`,
            ),
          );
          return;
        }
        if (data.length === 0) {
          reject(new Error("The file has no products in it."));
          return;
        }
        if (data.length > MAX_IMPORT_ROWS) {
          reject(
            new Error(`Import up to ${MAX_IMPORT_ROWS} products at a time.`),
          );
          return;
        }
        resolve(data);
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}

export function importProducts(
  rows: ProductCsvRow[],
  dryRun: boolean,
): Promise<ImportResult> {
  return adminRequest<ImportResult>({
    method: "post",
    url: "/admin/products/import",
    data: { rows, dryRun },
  });
}
