import type { ValidatedCartLine } from "@repo/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  applyValidation: (validated: ValidatedCartLine[]) => void;
}

function capped(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, stock));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (entry) => entry.productId === line.productId,
          );
          if (existing) {
            return {
              lines: state.lines.map((entry) =>
                entry.productId === line.productId
                  ? {
                      ...entry,
                      price: line.price,
                      stock: line.stock,
                      quantity: capped(entry.quantity + quantity, line.stock),
                    }
                  : entry,
              ),
            };
          }
          const next = capped(quantity, line.stock);
          return next > 0
            ? { lines: [...state.lines, { ...line, quantity: next }] }
            : state;
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines: state.lines.flatMap((entry) => {
            if (entry.productId !== productId) return [entry];
            const next = capped(quantity, entry.stock);
            return next > 0 ? [{ ...entry, quantity: next }] : [];
          }),
        })),
      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((entry) => entry.productId !== productId),
        })),
      clear: () => set({ lines: [] }),
      applyValidation: (validated) =>
        set((state) => ({
          lines: state.lines.flatMap((entry) => {
            const fresh = validated.find(
              (item) => item.productId === entry.productId,
            );
            if (!fresh || fresh.unavailable || fresh.quantity === 0) return [];
            return [
              {
                ...entry,
                name: fresh.name,
                slug: fresh.slug,
                price: fresh.price,
                imageUrl: fresh.imageUrl,
                stock: fresh.stock,
                quantity: fresh.quantity,
              },
            ];
          }),
        })),
    }),
    {
      name: "i3-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0);
}
