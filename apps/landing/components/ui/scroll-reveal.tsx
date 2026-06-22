"use client";

import { useRef, type ReactNode } from "react";
import { motion, type Variants, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  once?: boolean;
  stagger?: number;
}

const DIRECTION_VARIANTS: Record<NonNullable<ScrollRevealProps["direction"]>, Variants> = {
  up: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
  },
  down: {
    hidden: { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
  },
  left: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.55 } },
  },
  right: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.55 } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.55 } },
  },
};

function getStaggerContainer(staggerDelay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };
}

function getItemVariant(direction: ScrollRevealProps["direction"]): Variants {
  return {
    hidden: DIRECTION_VARIANTS[direction ?? "up"].hidden,
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 24,
        stiffness: 180,
        mass: 0.6,
        duration: 0.55,
      },
    },
  };
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  once = true,
  stagger,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  if (stagger !== undefined && Array.isArray(children)) {
    const containerVariants = getStaggerContainer(stagger);
    const itemVariants = getItemVariant(direction);

    return (
      <motion.div
        ref={ref}
        className={cn("w-full", className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: "-40px" }}
      >
        {children.map((child, i) => (
          <motion.div key={i} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  const baseVariants = DIRECTION_VARIANTS[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: baseVariants.hidden,
        visible: {
          ...baseVariants.visible,
          transition: {
            type: "spring",
            damping: 26,
            stiffness: 170,
            mass: 0.7,
            delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}
