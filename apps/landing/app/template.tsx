"use client";

import { useScroll, useTransform, motion, useReducedMotion } from "framer-motion";

/**
 * Template — per-page wrapper for Arkelythex landing.
 * Renders a scroll-linked progress bar at the top of the viewport.
 * In Next.js App Router, `template.tsx` is re-rendered on every route change
 * (unlike `layout.tsx` which persists), making it ideal for route transitions
 * and per-page scroll tracking.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <>
      {/* Scroll progress bar — thin copper line at top of viewport */}
      {!reducedMotion && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-primary"
          style={{ scaleX }}
          aria-hidden
        />
      )}
      {children}
    </>
  );
}
