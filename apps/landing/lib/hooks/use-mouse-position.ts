"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

interface UseMousePositionOptions {
  /** Only track within a specific element ref */
  elementRef?: React.RefObject<HTMLElement | null>;
  /** Throttle in ms (default 16 ≈ 60fps) */
  throttle?: number;
  /** Only track when user moves, disable for reduced motion users */
  respectReducedMotion?: boolean;
}

export function useMousePosition(options?: UseMousePositionOptions): MousePosition {
  const reduceMotion = useReducedMotion();
  const disabled = options?.respectReducedMotion !== false && reduceMotion;
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (disabled) return;
      const ref = options?.elementRef?.current ?? null;

      let x: number;
      let y: number;
      let normalizedX: number;
      let normalizedY: number;

      if (ref) {
        const rect = ref.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        normalizedX = x / rect.width;
        normalizedY = y / rect.height;
      } else {
        x = e.clientX;
        y = e.clientY;
        normalizedX = x / window.innerWidth;
        normalizedY = y / window.innerHeight;
      }

      if (!options?.throttle || options.throttle <= 0) {
        setPosition({ x, y, normalizedX, normalizedY });
        return;
      }

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          setPosition({ x, y, normalizedX, normalizedY });
          rafRef.current = null;
        });
      }
    },
    [disabled, options?.elementRef, options?.throttle],
  );

  useEffect(() => {
    if (disabled) return;

    const target = options?.elementRef?.current ?? window;
    target.addEventListener("mousemove", handleMouseMove as EventListener, { passive: true });

    return () => {
      target.removeEventListener("mousemove", handleMouseMove as EventListener);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, disabled, options?.elementRef]);

  return position;
}
