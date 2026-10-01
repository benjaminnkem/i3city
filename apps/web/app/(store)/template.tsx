"use client";

import { motion } from "motion/react";
import { DURATION, EASE_OUT } from "@/lib/motion";

export default function StoreTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
