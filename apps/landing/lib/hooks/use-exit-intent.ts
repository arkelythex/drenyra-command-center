"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseExitIntentOptions {
  /** Max times to trigger per session (default: 1) */
  maxTriggers?: number;
  /** Cooldown in ms after trigger (default: 86400000 = 24h) */
  cooldown?: number;
  /** Scroll-up threshold in px for mobile detection (default: 50) */
  mobileScrollThreshold?: number;
  /** Delay in ms before enabling detection (default: 5000) */
  delay?: number;
}

interface UseExitIntentReturn {
  /** Whether exit intent was triggered */
  isTriggered: boolean;
  /** Manually reset the trigger */
  reset: () => void;
}

const STORAGE_KEY = "arkelythex-exit-intent";

function getLastTrigger(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function setLastTrigger(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(timestamp));
  } catch {
    // ignore
  }
}

/**
 * Detects exit intent via mouseleave (desktop) or rapid scroll-up (mobile).
 * Respects cooldown and max triggers per session.
 */
export function useExitIntent({
  maxTriggers = 1,
  cooldown = 86400000,
  mobileScrollThreshold = 50,
  delay = 5000,
}: UseExitIntentOptions = {}): UseExitIntentReturn {
  const triggerCountRef = useRef(0);
  const isTriggeredRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const enabledRef = useRef(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const reset = useCallback(() => {
    isTriggeredRef.current = false;
    triggerCountRef.current = 0;
    setIsTriggered(false);
  }, []);

  useEffect(() => {
    const lastTrigger = getLastTrigger();
    if (Date.now() - lastTrigger < cooldown) return;

    const enableTimer = setTimeout(() => {
      enabledRef.current = true;
    }, delay);

    const handleMouseLeave = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      if (e.clientY > 20) return; // Not near top
      if (triggerCountRef.current >= maxTriggers) return;

      triggerCountRef.current += 1;
      isTriggeredRef.current = true;
      setLastTrigger(Date.now());
      setIsTriggered(true);
    };

    const handleScroll = () => {
      if (!enabledRef.current) return;
      if (triggerCountRef.current >= maxTriggers) return;

      const currentY = window.scrollY;
      const diff = lastScrollYRef.current - currentY;

      // Mobile: rapid scroll-up near top
      if (diff > mobileScrollThreshold && currentY < 200) {
        triggerCountRef.current += 1;
        isTriggeredRef.current = true;
        setLastTrigger(Date.now());
        setIsTriggered(true);
      }

      lastScrollYRef.current = currentY;
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(enableTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [cooldown, delay, maxTriggers, mobileScrollThreshold]);

  return { isTriggered, reset };
}
