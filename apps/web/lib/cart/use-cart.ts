"use client";

import { useEffect, useState } from "react";
import { cartCount, cartSubtotal, useCartStore } from "./store";

export function useCartReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const persist = useCartStore.persist;
    if (!persist.hasHydrated()) {
      void persist.rehydrate();
    }
    const unsubscribe = persist.onFinishHydration(() => setReady(true));
    setReady(persist.hasHydrated());
    return unsubscribe;
  }, []);
  return ready;
}

export function useCart() {
  const ready = useCartReady();
  const lines = useCartStore((state) => state.lines);
  return {
    ready,
    lines: ready ? lines : [],
    count: ready ? cartCount(lines) : 0,
    subtotal: ready ? cartSubtotal(lines) : 0,
  };
}
