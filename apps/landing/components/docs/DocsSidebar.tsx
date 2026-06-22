"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { Camera, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDocsNavContext,
  type DocsNavGroup,
  type DocsNavItem,
  isDocsNavItemActive,
} from "@/lib/data/docs-nav";

type DocsSidebarProps = {
  /** Cerrar drawer móvil tras navegar */
  onNavigate?: () => void;
  className?: string;
};

function openSetForRoute(
  groups: readonly DocsNavGroup[],
  pathname: string,
  hash: string,
): Set<string> {
  const withActive = groups.filter((g) => g.items.some((i) => isDocsNavItemActive(i, pathname, hash)));
  if (withActive.length > 0) {
    return new Set(withActive.map((g) => g.title));
  }
  if (groups[0]?.title) {
    return new Set([groups[0].title]);
  }
  return new Set();
}

export default function DocsSidebar({ onNavigate, className }: DocsSidebarProps) {
  const pathname = usePathname();
  const navRootId = useId();

  const { groups: navGroups, ariaLabel: navLabel, variant } = getDocsNavContext(pathname);

  const [hash, setHash] = useState<string>("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => openSetForRoute(navGroups, pathname, typeof window !== "undefined" ? window.location.hash : ""));

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      setHash(currentHash);
      setOpenGroups(openSetForRoute(navGroups, pathname, currentHash));
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [navGroups, pathname]);

  const handleLink = useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  const toggleGroup = useCallback((title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  return (
    <div
      className={cn("flex h-full min-h-0 w-full min-w-0 max-w-full flex-col", className)}
    >
      <nav
        aria-label={navLabel}
        className="docs-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 lg:pt-4"
      >
        {navGroups.map((group) => {
          const isOpen = openGroups.has(group.title);
          const groupKey = `group-${group.title}`;
          const headingId = `${navRootId}-${groupKey}-heading`;
          const panelId = `${navRootId}-${groupKey}-panel`;

          return (
            <section key={group.title} className="mb-2 last:mb-0">
              <h3 id={headingId} className="m-0 text-label font-bold uppercase leading-tight">
                <button
                  type="button"
                  className="flex w-full min-h-11 items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/40 px-2.5 py-2.5 text-left text-label font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-card/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.title)}
                >
                  <span className="min-w-0 break-words leading-snug">{group.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                hidden={!isOpen}
                className="border-b border-border/20 pb-1"
              >
                <ul className="list-none space-y-0.5 py-1 pl-0" role="list">
                  {group.items.map((item: DocsNavItem) => {
                    const active = isDocsNavItemActive(item, pathname, hash);
                    return (
                      <li key={`${group.title}-${item.href}-${item.label}`}>
                        <Link
                          href={item.href}
                          onClick={handleLink}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center justify-between gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm text-muted-foreground transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]",
                            active
                              ? "border-primary/30 bg-primary/10 font-medium text-foreground ring-1 ring-primary/20"
                              : "hover:bg-card/40 hover:text-foreground",
                          )}
                        >
                          <span className="min-w-0 break-words leading-snug">{item.label}</span>
                          {active ? (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.45)]"
                              aria-hidden
                            />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </nav>

      {variant === "design-system" ? (
        <div className="shrink-0 border-t border-border/50 bg-sidebar-bg/95 p-2.5 sm:p-3">
          <div className="rounded-lg border border-border/50 bg-card/30 p-2.5 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span className="font-medium">Arkelythex Design System</span>
            </div>
            <p className="pl-0.5 text-2xs opacity-80">v1.0.0</p>
          </div>
        </div>
      ) : null}

      {variant === "media-kit" ? (
        <div className="shrink-0 border-t border-border/50 bg-sidebar-bg/95 p-2.5 sm:p-3">
          <div className="rounded-lg border border-border/50 bg-card/30 p-2.5 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <Camera className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span className="font-medium">Media Kit</span>
            </div>
            <p className="pl-0.5 text-2xs leading-relaxed opacity-80">
              Tokens y componentes UI en{" "}
              <Link
                href="/docs/design-system"
                onClick={handleLink}
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Design System
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
