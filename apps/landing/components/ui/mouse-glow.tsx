"use client";

import type { ReactElement } from "react";
import { useRef } from "react";
import { motion } from "framer-motion";
import { useMousePosition } from "@/lib/hooks/use-mouse-position";
import { cn } from "@/lib/utils";

interface MouseGlowProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
  blurRadius?: number;
}

export function MouseGlow({
  className,
  size = 600,
  color = "var(--color-primary, #FAFAF8)",
  opacity = 0.07,
  blurRadius = 140,
}: MouseGlowProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const { normalizedX, normalizedY } = useMousePosition({
    elementRef: containerRef,
    respectReducedMotion: true,
  });

  return (
    <div ref={containerRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          filter: `blur(${blurRadius}px)`,
          opacity,
          x: `calc(${normalizedX * 100}% - ${size / 2}px)`,
          y: `calc(${normalizedY * 100}% - ${size / 2}px)`,
        }}
        animate={{
          x: `calc(${normalizedX * 100}% - ${size / 2}px)`,
          y: `calc(${normalizedY * 100}% - ${size / 2}px)`,
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
      />
    </div>
  );
}
