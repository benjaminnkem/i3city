import type { AdminCategory } from "@repo/types";
import { z } from "zod";
import { adminRequest, adminRequestVoid } from "./client";

export const categoryKeys = {
  all: ["admin", "categories"] as const,
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(80, "Keep the name under 80 characters"),
  slug: z
    .string()
    .trim()
    .max(100, "Keep the slug under 100 characters")
    .refine(
      (value) => value === "" || SLUG_PATTERN.test(value),
      "Use lowercase letters, numbers and hyphens",
    ),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function listCategories(): Promise<AdminCategory[]> {
  return adminRequest<AdminCategory[]>({ url: "/admin/categories" });
}

export function createCategory(name: string): Promise<AdminCategory> {
  return adminRequest<AdminCategory>({
    method: "post",
    url: "/admin/categories",
    data: { name },
  });
}

export function updateCategory(
  id: string,
  input: { name?: string; slug?: string },
): Promise<AdminCategory> {
  return adminRequest<AdminCategory>({
    method: "patch",
    url: `/admin/categories/${id}`,
    data: input,
  });
}

export function reorderCategories(ids: string[]): Promise<AdminCategory[]> {
  return adminRequest<AdminCategory[]>({
    method: "put",
    url: "/admin/categories/order",
    data: { ids },
  });
}

export function deleteCategory(id: string): Promise<void> {
  return adminRequestVoid({ method: "delete", url: `/admin/categories/${id}` });
}
