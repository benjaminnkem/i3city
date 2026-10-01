"use client";

import { motion } from "motion/react";
import {
  itemVariants,
  REVEAL_VIEWPORT,
  STAGGER,
  type RevealVariant,
} from "@/lib/motion";

type Trigger = "view" | "mount";

type StaggerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  trigger?: Trigger;
  gap?: keyof typeof STAGGER;
  delay?: number;
  as?: "div" | "ul" | "section";
}>;

const containers = {
  div: motion.div,
  ul: motion.ul,
  section: motion.section,
} as const;

export function Stagger({
  children,
  className,
  trigger = "view",
  gap = "tight",
  delay = 0,
  as = "div",
}: StaggerProps) {
  const Container = containers[as];
  const variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: STAGGER[gap], delayChildren: delay },
    },
  };
  return trigger === "mount" ? (
    <Container
      className={className}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </Container>
  ) : (
    <Container
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </Container>
  );
}

const items = {
  div: motion.div,
  li: motion.li,
} as const;

export function RevealItem({
  children,
  className,
  variant = "rise",
  as = "div",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  as?: "div" | "li";
}>) {
  const Item = items[as];
  return (
    <Item className={className} variants={itemVariants[variant]}>
      {children}
    </Item>
  );
}

export function Reveal({
  children,
  className,
  variant = "rise",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
}>) {
  return (
    <motion.div
      className={className}
      variants={itemVariants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </motion.div>
  );
}
