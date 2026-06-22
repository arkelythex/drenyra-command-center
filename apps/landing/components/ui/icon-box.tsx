import type { ElementType } from "react";

import { cn } from "@/lib/utils";

export type IconBoxSize = "sm" | "md" | "lg";
export type IconBoxVariant = "default" | "accent" | "primary" | "secondary" | "success";

export interface IconBoxProps {
  icon: ElementType;
  size?: IconBoxSize;
  variant?: IconBoxVariant;
  className?: string;
  ariaLabel?: string;
}

const SIZES: Record<IconBoxSize, { box: string; icon: string }> = {
  sm: { box: "h-10 w-10 min-h-[44px] min-w-[44px]", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 min-h-[44px] min-w-[44px]", icon: "h-6 w-6" },
  lg: { box: "h-14 w-14 min-h-[48px] min-w-[48px]", icon: "h-7 w-7" },
};

const VARIANTS: Record<IconBoxVariant, string> = {
  default: "border-border bg-foreground/5 text-foreground",
  accent: "border-foreground/15 bg-foreground/5 text-foreground/80",
  primary: "border-foreground/20 bg-foreground/10 text-foreground",
  secondary: "border-foreground/10 bg-foreground/5 text-muted-foreground",
  success: "border-foreground/15 bg-foreground/5 text-foreground/70",
};

/**
 * Contenedor para íconos con fondo/borde consistente.
 * RSC-compatible.
 */
export function IconBox({
  icon: Icon,
  size = "md",
  variant = "default",
  className,
  ariaLabel,
}: IconBoxProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border",
        SIZES[size].box,
        VARIANTS[variant],
        className,
      )}
      role="img"
      aria-label={ariaLabel || "icon"}
    >
      <Icon className={SIZES[size].icon} />
    </div>
  );
}
