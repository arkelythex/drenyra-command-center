"use client";

// ============================================================================
// SHARED PRIMITIVES — re-exported from @arkelythex/ui (migrated from local)
// ============================================================================

export {
  Badge,
  Button,
  Card,
  type BadgeProps,
  type BadgeVariant,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type CardProps,
} from "@arkelythex/ui";

// Landing-specific components imported directly
import { FeatureCard, type FeatureCardProps, type FeatureCardVariant } from "@/components/ui/feature-card";
import { GradientText, type GradientTextProps, type GradientTextVariant } from "@/components/ui/gradient-text";
import { Grid as DocGrid, Grid, type GridCols, type GridGap, type GridProps } from "@/components/ui/grid";
import { IconBox, type IconBoxSize, type IconBoxVariant } from "@/components/ui/icon-box";
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SectionContainer, type SectionVariant } from "@/components/ui/section-container";
import { SectionHeader, type SectionHeaderProps } from "@/components/ui/section-header";
import { StatCard, type StatCardProps } from "@/components/ui/stat-card";

export {
  FeatureCard,
  GradientText,
  DocGrid,
  Grid,
  IconBox,
  PageHeader,
  ScrollReveal,
  SectionContainer,
  SectionHeader,
  StatCard,
  type FeatureCardProps,
  type FeatureCardVariant,
  type GradientTextProps,
  type GradientTextVariant,
  type GridCols,
  type GridGap,
  type GridProps,
  type IconBoxSize,
  type IconBoxVariant,
  type PageHeaderProps,
  type SectionHeaderProps,
  type SectionVariant,
  type StatCardProps,
};

// ============================================================================
// DOCS-SPECIFIC COMPONENTS
// ============================================================================

import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// DocSection — lightweight space-y wrapper for docs pages
interface DocSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function DocSection({
  children,
  className,
  id,
}: DocSectionProps): React.ReactElement {
  return (
    <section
      id={id}
      className={cn("space-y-4 sm:space-y-5 md:space-y-6", className)}
    >
      {children}
    </section>
  );
}

// DocCard — docs-specific card with gradient/glass variants
interface DocCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "gradient" | "glass" | "outline";
  hover?: boolean;
}

export function DocCard({
  children,
  className,
  id,
  variant = "default",
  hover = true,
}: DocCardProps): React.ReactElement {
  const variants = {
    default: "border-border/80 bg-surface/90 shadow-sm",
    gradient: "border-border/80 bg-gradient-to-br from-surface to-surface/40",
    glass: "border-border/80 bg-surface/80 backdrop-blur-md",
    outline: "border border-border/60 bg-transparent",
  };

  return (
    <div
      id={id}
      className={cn(
        "rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        variants[variant],
        hover && [
          "hover:border-accent/40 hover:bg-surface/95",
          "motion-reduce:active:scale-100 active:scale-[0.99] active:bg-surface/80",
          "motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-xl motion-safe:hover:shadow-[rgba(14,10,8,0.30)]",
        ],
        className,
      )}
    >
      {children}
    </div>
  );
}

// SectionTitle — docs-specific section header with icon
interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  variant?: "default" | "accent" | "primary";
  action?: React.ReactNode;
  /** Ancla para TOC y enlaces (#id). Si la sección ya tiene `id` en el wrapper, omitir para evitar duplicados. */
  headingId?: string;
}

export function SectionTitle({
  icon: Icon,
  title,
  variant = "default",
  action,
  headingId,
}: SectionTitleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2 sm:gap-3">
        <IconBox icon={Icon} variant={variant} size="sm" ariaLabel={title} />
        <h2
          id={headingId}
          className={cn(
            "text-xl sm:text-2xl md:text-3xl font-bold text-foreground",
            headingId && "scroll-mt-28",
          )}
        >
          {title}
        </h2>
      </div>
      {action && <div className="w-full sm:w-auto mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}

// CTAButton — docs-specific button (kept for backward compat)
interface CTAButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: React.ElementType;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function CTAButton({
  children,
  variant = "primary",
  icon: Icon,
  className,
  onClick,
  ariaLabel,
}: CTAButtonProps): React.ReactElement {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold transition-all duration-200 group w-full sm:w-auto";

  const variants = {
    primary: [
      "bg-primary text-primary-foreground hover:bg-primary/90",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "active:scale-[0.98]",
      "motion-safe:group-hover:translate-x-0.5",
    ],
    secondary: [
      "border border-border text-foreground hover:border-accent/30 hover:bg-surface/50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "active:scale-[0.98]",
    ],
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, variants[variant], className)}
      aria-label={ariaLabel}
    >
      {children}
      {Icon && (
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform motion-safe:group-hover:translate-x-1" />
      )}
    </button>
  );
}

// Re-export cn utility
export { cn };
