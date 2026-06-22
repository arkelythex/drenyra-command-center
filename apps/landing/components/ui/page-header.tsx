import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@arkelythex/ui";
import { GradientText } from "./gradient-text";

export interface PageHeaderProps {
  badge?: {
    icon: ElementType;
    text: string;
  };
  title: ReactNode;
  highlight?: ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Header de página reutilizable (título + subtítulo).
 * Composes Badge + GradientText.
 * RSC-compatible.
 */
export function PageHeader({
  badge,
  title,
  highlight,
  description,
  align = "center",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "space-y-4 sm:space-y-6",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {badge && (
        <div
          className={cn(
            "flex",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          <Badge variant="accent">
            <badge.icon className="h-3.5 w-3.5" aria-hidden />
            {badge.text}
          </Badge>
        </div>
      )}

      <h1 className="text-balance text-3xl font-black leading-tight tracking-[-0.045em] text-foreground md:text-5xl lg:text-[3.35rem]">
        {title}
        {highlight != null && (
          <>
            {" "}
            <GradientText>{highlight}</GradientText>
          </>
        )}
      </h1>

      {description && (
        <p
          className={cn(
            "max-w-2xl text-sm leading-relaxed landing-body-muted md:text-base",
            align === "center" ? "mx-auto" : undefined,
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
