"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useReducedMotion } from "./use-reduced-motion";

export interface UseCountUpOptions {
  /** Target number to count up to */
  end: number;
  /** Animation duration in milliseconds (default: 2000) */
  duration?: number;
  /** Whether to start animation on mount (default: false) */
  startOnMount?: boolean;
}

export interface UseCountUpReturn {
  /** Current count value */
  count: number;
  /** Manually start the count-up animation */
  start: () => void;
  /** Reset count to 0 */
  reset: () => void;
  /** Whether the animation is currently running */
  isRunning: boolean;
}

/**
 * Custom hook for count-up animations using requestAnimationFrame + performance.now().
 *
 * Respects `prefers-reduced-motion` — if reduced motion is preferred, jumps to end immediately.
 * Uses `tabular-nums` font feature for stable number width during animation.
 *
 * @example
 * const { count, start, reset, isRunning } = useCountUp({ end: 1000, duration: 2000, startOnMount: false });
 */
export function useCountUp({
  end,
  duration = 2000,
  startOnMount = false,
}: UseCountUpOptions): UseCountUpReturn {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const endValueRef = useRef(end);

  // Keep endValueRef in sync when `end` prop changes
  useEffect(() => {
    endValueRef.current = end;
  }, [end]);

  const start = useCallback(() => {
    // If reduced motion, jump directly to end
    if (prefersReducedMotion) {
      setCount(endValueRef.current);
      setIsRunning(false);
      return;
    }

    // Cancel any existing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setIsRunning(true);
    startTimeRef.current = null;

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - x)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * endValueRef.current);

      setCount(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [prefersReducedMotion, duration]);

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsRunning(false);
    startTimeRef.current = null;
    setCount(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Start on mount if startOnMount is true
  useEffect(() => {
    if (startOnMount) {
      // Small delay to avoid SSR hydration issues
      const timer = setTimeout(() => {
        start();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [startOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  return { count, start, reset, isRunning };
}
