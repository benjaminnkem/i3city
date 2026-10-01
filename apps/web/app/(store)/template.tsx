"use client";

import * as m from "motion/react-m";
import { DURATION, EASE_OUT } from "@/lib/motion";

export default function StoreTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <m.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE_OUT }}
    >
      {children}
    </m.div>
  );
}
