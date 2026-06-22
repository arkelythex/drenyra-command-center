"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocsSearchIndex } from "@/lib/data/docs-nav";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

const INDEX = getDocsSearchIndex();

type DocsCommandMenuProps = {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
};

export function DocsCommandMenu({ open, onClose, onNavigate }: DocsCommandMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");

  useFocusTrap(open, panelRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDEX;
    return INDEX.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        e.href.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setQuery("");
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleNav = () => {
    onNavigate?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center landing-doc-command-offset px-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/75 backdrop-blur-[2px]"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en documentación"
        className="relative z-10 flex landing-max-h-doc-dialog w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas…"
            aria-label="Buscar páginas de documentación"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            ref={closeRef}
            type="button"
            className="inline-flex h-11 min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-border text-muted-foreground touch-manipulation [-webkit-tap-highlight-color:transparent] hover:bg-card/50 hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        <p className="border-b border-border px-3 py-1.5 text-2xs uppercase tracking-wider text-muted-foreground">
          Ctrl+K · ⌘K · / fuera de campos
        </p>
        <ul className="landing-max-h-doc-listbox overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            filtered.map((entry) => (
              <li key={`${entry.href}-${entry.label}-${entry.group}`} role="option">
                <Link
                  href={entry.href}
                  onClick={handleNav}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-card/60",
                  )}
                >
                  <span className="font-medium text-foreground">{entry.label}</span>
                  <span className="text-label text-muted-foreground">{entry.group}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
