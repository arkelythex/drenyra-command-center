"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  docs: "Documentación",
  "design-system": "Design System",
  investors: "Inversores",
  vision: "Visión",
  roadmap: "Roadmap",
  visuals: "Media Kit",
  architecture: "Arquitectura",
  "sovereign-core": "Sovereign Core",
  "sunat-compliance": "SUNAT Compliance",
  "cbdc-banking": "CBDC & Banking",
};

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Inicio" }];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const seg = segments[i]!;
    const label = SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ");
    crumbs.push({ href: acc, label });
  }

  return (
    <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden /> : null}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link
              href={c.href}
              className="inline-flex items-center gap-1 rounded hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {i === 0 ? <Home className="h-3 w-3" aria-hidden /> : null}
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
