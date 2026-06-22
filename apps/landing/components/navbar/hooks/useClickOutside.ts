/**
 * useClickOutside Hook
 * Single Responsibility: Detect clicks outside a referenced element
 */

import { useEffect, useRef, useCallback } from "react";

interface UseClickOutsideReturn<T extends HTMLElement> {
  readonly ref: React.RefObject<T | null>;
}

export function useClickOutside<T extends HTMLElement>(
  onClickOutside: () => void
): UseClickOutsideReturn<T> {
  const ref = useRef<T>(null);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    },
    [onClickOutside]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [handleClick]);

  return { ref };
}