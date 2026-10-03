"use client";

import type { PublicProduct } from "@repo/types";
import { useEffect, useState } from "react";
import { requestPage } from "@/lib/api";

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 5;

interface Settled {
  query: string;
  items: PublicProduct[];
  total: number;
  failed: boolean;
}

export type ProductSearch =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; items: PublicProduct[]; total: number };

export function useProductSearch(term: string): ProductSearch {
  const query = term.trim();
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (query.length < MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      requestPage<PublicProduct>({
        url: "/products",
        params: { search: query, limit: RESULT_LIMIT },
        signal: controller.signal,
      })
        .then(({ items, meta }) =>
          setSettled({ query, items, total: meta.total, failed: false }),
        )
        .catch(() => {
          if (!controller.signal.aborted) {
            setSettled({ query, items: [], total: 0, failed: true });
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (query.length < MIN_LENGTH) return { status: "idle" };
  if (!settled || settled.query !== query) return { status: "loading" };
  if (settled.failed) return { status: "error" };
  return { status: "done", items: settled.items, total: settled.total };
}
