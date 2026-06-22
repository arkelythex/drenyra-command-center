/**
 * NavItem Component
 * Single Responsibility: Render single navigation link (no dropdowns)
 */

import type { ReactElement } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { NavItemProps } from "../types";

export function NavItemComponent({
  item,
  isActive,
  onClick,
}: NavItemProps): ReactElement {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "nav-link px-4 py-2 rounded-lg transition-colors block",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive ? "nav-link-active" : "hover:bg-muted"
      )}
    >
      {item.name}
    </Link>
  );
}