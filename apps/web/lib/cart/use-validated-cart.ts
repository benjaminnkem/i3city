"use client";

import { formatNaira, type ValidatedCartLine } from "@repo/types";
import { useEffect, useRef, useState } from "react";
import { validateCart } from "@/lib/store/client";
import { useCartStore } from "./store";
import { useCartReady } from "./use-cart";

function describe(
  line: ValidatedCartLine,
  previousName: string,
): string | null {
  if (line.unavailable)
    return `${previousName} is no longer available and was removed.`;
  if (line.quantityAdjusted)
    return `Only ${line.stock} of ${line.name} are in stock, so we updated your quantity.`;
  if (line.priceChanged)
    return `The price of ${line.name} is now ${formatNaira(line.price)}.`;
  return null;
}

export function useValidatedCart(): {
  notices: string[];
  checking: boolean;
  failed: boolean;
} {
  const ready = useCartReady();
  const applyValidation = useCartStore((state) => state.applyValidation);
  const [notices, setNotices] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!ready || ran.current) return;
    ran.current = true;
    const lines = useCartStore.getState().lines;
    if (lines.length === 0) {
      setChecking(false);
      return;
    }
    validateCart(lines)
      .then((validated) => {
        const names = new Map(lines.map((line) => [line.productId, line.name]));
        setNotices(
          validated.flatMap((line) => {
            const message = describe(
              line,
              names.get(line.productId) ?? line.name,
            );
            return message ? [message] : [];
          }),
        );
        applyValidation(validated);
      })
      .catch(() => setFailed(true))
      .finally(() => setChecking(false));
  }, [ready, applyValidation]);

  return { notices, checking, failed };
}
