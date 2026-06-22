"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface AnimatedCounterProps {
  /** The target number to animate to */
  target: number;
  /** Prefix to show before the number (e.g., "$", "S/") */
  prefix?: string;
  /** Suffix to show after the number (e.g., "%", "+", "K") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Duration of animation in seconds */
  duration?: number;
  /** Optional label below the counter */
  label?: string;
  /** Optional detail text below the label */
  detail?: string;
  /** Custom className */
  className?: string;
}

function AnimatedCounterInner({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2,
  className,
  label,
}: Omit<AnimatedCounterProps, "detail">) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (decimals > 0) {
      return `${prefix}${latest.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(latest)}${suffix}`;
  });
  const [displayValue, setDisplayValue] = useState(
    `${prefix}0${suffix}`
  );

  // Immediately show final value if reduced motion
  useEffect(() => {
    if (reduceMotion) {
      if (decimals > 0) {
        setDisplayValue(`${prefix}${target.toFixed(decimals)}${suffix}`);
      } else {
        setDisplayValue(`${prefix}${target}${suffix}`);
      }
      return;
    }
  }, [reduceMotion, target, prefix, suffix, decimals]);

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    const controls = animate(motionValue, target, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    });

    const unsubscribe = rounded.on("change", (v) => {
      setDisplayValue(v);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [isInView, target, duration, motionValue, rounded, prefix, suffix, reduceMotion]);

  return (
    <motion.span
      ref={ref}
      className={cn(
        "text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-foreground tabular-nums",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      role="status"
      aria-live="polite"
      aria-label={`${prefix}${target}${suffix} ${label ?? ""}`.trim()}
    >
      {displayValue}
    </motion.span>
  );
}

export function AnimatedCounter({
  target,
  prefix,
  suffix,
  decimals,
  duration,
  label,
  detail,
  className,
}: AnimatedCounterProps) {
  return (
    <div className={cn("text-center", className)}>
      <AnimatedCounterInner
        target={target}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={duration}
        label={label}
      />
      {label && (
        <p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
      )}
      {detail && (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
