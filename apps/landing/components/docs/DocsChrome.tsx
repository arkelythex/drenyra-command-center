"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Code2, Menu, Search, Share2, X } from "lucide-react";

import DocsSidebar from "@/components/docs/DocsSidebar";
import { DocsBreadcrumbs } from "@/components/docs/DocsBreadcrumbs";
import { DocsCommandMenu } from "@/components/docs/DocsCommandMenu";
import { Logo } from "@/components/navbar/components/Logo";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

type DocsChromeProps = { children: ReactNode };

async function shareOrCopyPageUrl(onAnnounce: (msg: string) => void): Promise<void> {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = typeof document !== "undefined" ? document.title : "Arkelythex";
  try {
    if (typeof navigator !== "undefined" && "share" in navigator && navigator.share) {
      await navigator.share({ title, url });
      onAnnounce("Compartido");
      return;
    }
  } catch { /* cancelado */ }
  try {
    await navigator.clipboard.writeText(url);
    onAnnounce("Enlace copiado al portapapeles");
  } catch {
    onAnnounce("No se pudo copiar el enlace");
  }
}

async function copyPageUrlOnly(onAnnounce: (msg: string) => void): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    onAnnounce("Enlace copiado al portapapeles");
  } catch {
    onAnnounce("No se pudo copiar el enlace");
  }
}

export function DocsChrome({ children }: DocsChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [announce, setAnnounce] = useState<string | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevDrawerOpen = useRef(false);
  const titleId = useId();
  const announceId = useId();

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const announceMsg = useCallback((msg: string) => { setAnnounce(msg); window.setTimeout(() => setAnnounce(null), 3500); }, []);

  useFocusTrap(mobileNavOpen, drawerPanelRef);

  useEffect(() => { if (prevDrawerOpen.current && !mobileNavOpen) menuButtonRef.current?.focus(); prevDrawerOpen.current = mobileNavOpen; }, [mobileNavOpen]);
  useEffect(() => { if (!mobileNavOpen) return; const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0); return () => window.clearTimeout(t); }, [mobileNavOpen]);
  useEffect(() => { if (!mobileNavOpen) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMobileNav(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [mobileNavOpen, closeMobileNav]);
  useEffect(() => { if (!mobileNavOpen) return; const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [mobileNavOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setMobileNavOpen(false); setSearchOpen((o) => !o); return; }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as HTMLElement | null; if (!t) return;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
        e.preventDefault(); setMobileNavOpen(false); setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openSearch = useCallback(() => { setMobileNavOpen(false); setSearchOpen(true); }, []);
  const btnBase = "inline-flex h-10 min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-muted-foreground transition-colors hover:border-white/[0.08] hover:text-foreground";

  return (
    <div className="min-h-screen bg-black font-sans text-foreground">
      <a href="#docs-main" className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg border border-white/[0.06] bg-background px-4 py-2 text-sm font-medium text-foreground opacity-0 transition focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50">Saltar al contenido</a>

      <div aria-live="polite" aria-atomic="true" id={announceId} className="sr-only">{announce}</div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            <button ref={menuButtonRef} type="button" className={btnBase + " lg:hidden"} aria-expanded={mobileNavOpen} aria-controls="docs-mobile-nav" aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMobileNavOpen((o) => !o)}>
              {mobileNavOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
            <Logo />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button type="button" onClick={openSearch} className={btnBase + " sm:hidden"} aria-label="Buscar en documentación"><Search className="h-5 w-5" aria-hidden /></button>
            <Link href="/" className={btnBase + " hidden sm:inline-flex px-3 py-1.5 text-xs font-medium"}>Ir al sitio</Link>
            <button type="button" onClick={openSearch} className={btnBase + " hidden sm:inline-flex gap-2 px-3 py-1.5 text-xs font-medium"}>
              <Search className="h-3.5 w-3.5" aria-hidden /> Buscar <kbd className="rounded border border-white/[0.06] bg-white/[0.02] px-1 font-mono text-2xs text-muted-foreground">⌘K</kbd>
            </button>
            <button type="button" onClick={() => shareOrCopyPageUrl(announceMsg)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15">
              <Share2 className="h-3.5 w-3.5" aria-hidden /> Compartir
            </button>
            <button type="button" onClick={() => copyPageUrlOnly(announceMsg)} className={btnBase} title="Copiar enlace">
              <Code2 className="h-4 w-4" aria-hidden /><span className="sr-only">Copiar enlace</span>
            </button>
          </div>
        </div>
      </header>

      <DocsCommandMenu open={searchOpen} onClose={closeSearch} onNavigate={() => { closeSearch(); closeMobileNav(); }} />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Cerrar navegación" onClick={closeMobileNav} />
          <div ref={drawerPanelRef} id="docs-mobile-nav" role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute bottom-0 left-0 top-0 flex w-[min(100vw-2.5rem,20rem)] flex-col border-r border-white/[0.06] bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p id={titleId} className="text-sm font-semibold text-foreground">Navegación</p>
              <button ref={closeBtnRef} type="button" className={btnBase} onClick={closeMobileNav}><X className="h-5 w-5" aria-hidden /><span className="sr-only">Cerrar</span></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto"><DocsSidebar onNavigate={closeMobileNav} className="border-0" /></div>
          </div>
        </div>
      )}

      <div className="relative grid min-h-0 items-stretch lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-16 z-20 hidden h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] w-full overflow-hidden border-r border-white/[0.06] bg-background lg:flex lg:flex-col">
          <DocsSidebar className="min-h-0 flex-1" />
        </aside>

        <main id="docs-main" tabIndex={-1} className="relative min-w-0 overflow-x-hidden px-4 py-8 outline-none sm:px-8 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <DocsBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
