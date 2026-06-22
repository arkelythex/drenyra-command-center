import type { ReactNode } from "react";

import { LANDING_STICKY_ALIGNED_SHELL_CLASS } from "@/lib/landing/sticky-cta-layout";
import { cn } from "@/lib/utils";

type SectionVariant =
  | "default"
  | "muted"
  | "borderY"
  | "dark"
  | "borderTopMuted";

/** Alias for backward compat with LandingSection consumers */
type LandingSectionVariant = SectionVariant;

interface SectionContainerProps {
  id?: string;
  /** Passed to `aria-labelledby` on the `<section>` element. */
  ariaLabelledBy?: string;
  className?: string;
  /** Clases del contenedor interno (`container mx-auto …`). */
  contentClassName?: string;
  pyClassName?: string;
  variant?: SectionVariant;
  scrollMargin?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<SectionVariant, string> = {
  default: "bg-transparent",
  muted: "bg-secondary/5",
  borderY: "border-y border-border/10 bg-secondary/5",
  dark: "border-y border-border/10 bg-[color:var(--background-soft)]",
  borderTopMuted: "border-t border-border/10 bg-secondary/5",
};

/**
 * Container de sección con padding/width consistentes.
 * Reemplaza LandingSection con naming más genérico.
 * RSC-compatible.
 */
export function SectionContainer({
  id,
  ariaLabelledBy,
  className,
  contentClassName,
  pyClassName = "py-16 md:py-28 lg:py-32",
  variant = "default",
  scrollMargin = true,
  children,
}: SectionContainerProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        scrollMargin && id ? "scroll-mt-28" : undefined,
        pyClassName,
        VARIANTS[variant],
        className,
      )}
    >
      <div
        className={cn(LANDING_STICKY_ALIGNED_SHELL_CLASS, contentClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/** Alias for backward compat */
export const LandingSection = SectionContainer;
export type { LandingSectionVariant, SectionContainerProps, SectionVariant };
