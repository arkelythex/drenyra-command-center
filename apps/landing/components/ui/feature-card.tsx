import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Card } from "@arkelythex/ui";
import { IconBox } from "./icon-box";

export type FeatureCardVariant = "default" | "accent" | "primary";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: ElementType;
  variant?: FeatureCardVariant;
  className?: string;
  footer?: ReactNode;
}

/**
 * Card para features del producto.
 * Composes Card + IconBox.
 * RSC-compatible.
 */
export function FeatureCard({
  title,
  description,
  icon: Icon,
  variant = "default",
  className,
  footer,
}: FeatureCardProps) {
  const iconVariant: React.ComponentProps<typeof IconBox>["variant"] =
    variant === "accent"
      ? "accent"
      : variant === "primary"
        ? "primary"
        : "default";

  return (
    <Card
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden",
        "hover:border-accent/30 hover:bg-surface-hover",
        className,
      )}
    >
      {/* Brillo superior */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        aria-hidden
      />

      <IconBox icon={Icon} variant={iconVariant} size="md" ariaLabel={title} />

      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed landing-body-muted">
          {description}
        </p>
      </div>

      {footer && (
        <div className="mt-auto rounded-xl border border-border/50 bg-background/20 px-4 py-3">
          {footer}
        </div>
      )}
    </Card>
  );
}
