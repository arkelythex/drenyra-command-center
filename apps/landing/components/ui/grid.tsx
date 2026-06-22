import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type GridCols = 1 | 2 | 3 | 4 | 5;
export type GridGap = "sm" | "md" | "lg";

export interface GridProps {
  children: ReactNode;
  cols?: GridCols;
  gap?: GridGap;
  className?: string;
  as?: ElementType;
}

const COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

const GAPS: Record<GridGap, string> = {
  sm: "gap-3 sm:gap-4",
  md: "gap-4 sm:gap-5 md:gap-6",
  lg: "gap-5 sm:gap-6 md:gap-8",
};

/**
 * Grid layout con gap/cols consistentes.
 * RSC-compatible.
 */
export function Grid<T extends ElementType = "div">({
  children,
  cols = 2,
  gap = "md",
  className,
  as,
  ...rest
}: GridProps & Omit<ComponentPropsWithoutRef<T>, keyof GridProps>) {
  const Component = as ?? ("div" as T);

  return (
    <Component className={cn("grid", COLS[cols], GAPS[gap], className)} {...rest}>
      {children}
    </Component>
  );
}
