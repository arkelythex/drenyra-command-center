/**
 * SkipLink — primer enlace enfocable; salto a `#main-content` con foco programático (WCAG 2.4.1).
 * Patrón fijo + opacidad (misma idea que DocsChrome), sin depender de `focus:not-sr-only`.
 */

"use client";

import { useCallback, type ReactElement } from "react";

import type { SkipLinkProps } from "../types";

export function SkipLink({ href, children }: SkipLinkProps): ReactElement {
  const handleActivate = useCallback(() => {
    const id = href.replace(/^#/, "");
    if (!id || typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) return;
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }
    queueMicrotask(() => {
      el.focus({ preventScroll: true });
    });
  }, [href]);

  return (
    <a
      href={href}
      onClick={handleActivate}
      className="pointer-events-none fixed left-4 top-4 z-[200] -translate-y-24 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground opacity-0 transition duration-200 focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
    >
      {children}
    </a>
  );
}
