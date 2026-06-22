# Seguridad Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/seguridad` with a cinematic hero, SVG architecture diagram centerpiece, and varied section layouts to give it a distinctive visual identity.

**Architecture:** Create one new component (`SeguridadArchDiagram`) — an inline SVG layered architecture diagram with 4 stacked layers connected by arrow paths. Modify `seguridad-page.tsx` to use the new component, enhance the hero with CSS dot-grid background, increase icon sizes in pillars/certifications, and replace the 3rd FeatureCard grid with the diagram.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS 4, inline SVG, lucide-react icons.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `components/seguridad/seguridad-arch-diagram.tsx` | **Create** | SVG layered architecture diagram — 4 layers connected by arrow paths |
| `app/seguridad/seguridad-page.tsx` | **Modify** | New composition: cinematic hero, varied sections, diagram centerpiece |

---

### Task 1: Create SeguridadArchDiagram component

**Files:**
- Create: `components/seguridad/seguridad-arch-diagram.tsx`

- [ ] **Step 1: Create the component file**

Write `apps/landing/components/seguridad/seguridad-arch-diagram.tsx`:

```tsx
import type { ReactElement } from "react";
import { Lock, Users, History, Link } from "lucide-react";

interface ArchLayer {
  icon: typeof Lock;
  title: string;
  description: string;
  flow: string;
}

const LAYERS: ArchLayer[] = [
  {
    icon: Lock,
    title: "Cifrado AES-256",
    description:
      "Datos cifrados en tránsito con TLS 1.3 y en reposo con AES-256-GCM. Ningún dato sensible vive sin cifrar.",
    flow: "TLS 1.3 ────── AES-256-GCM",
  },
  {
    icon: Users,
    title: "Row Level Security (RLS)",
    description:
      "Políticas de acceso a nivel de fila en PostgreSQL. Cada usuario ve exactamente lo que le corresponde según su rol.",
    flow: "User ──▶ Role ──▶ Policy ──▶ Scoped Data",
  },
  {
    icon: History,
    title: "Trazabilidad de decisiones",
    description:
      "Hash + timestamp + regla aplicada por cada decisión operativa. Evidencia inmutable para auditoría.",
    flow: "Decisión ──▶ Hash ──▶ Timestamp ──▶ Regla",
  },
  {
    icon: Link,
    title: "Cadena de hash",
    description:
      "Cada bloque de operaciones conecta con el anterior mediante hash criptográfico. Integridad verificable.",
    flow: "Block #1 ──▶ Block #2 ──▶ Block #3",
  },
];

export function SeguridadArchDiagram(): ReactElement {
  return (
    <div className="relative mx-auto max-w-3xl" role="img" aria-label="Diagrama de arquitectura de seguridad con cuatro capas: cifrado, RLS, trazabilidad y cadena de hash">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="arch-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className="fill-muted-foreground/20"
            />
          </marker>
        </defs>
        {LAYERS.map((_, i) => {
          if (i === LAYERS.length - 1) return null;
          const y = 68 + i * 120 + 106;
          return (
            <path
              key={`connector-${i}`}
              d={`M 264 ${y - 2} L 264 ${y + 12}`}
              className="stroke-muted-foreground/20"
              strokeWidth="2"
              markerEnd="url(#arch-arrow)"
            />
          );
        })}
      </svg>
      <div className="relative space-y-3">
        {LAYERS.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.title}
              className="relative flex items-start gap-5 rounded-2xl border border-[var(--drenyra-border-soft)] bg-[var(--drenyra-card)] p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--drenyra-border-soft)] bg-[var(--drenyra-accent-muted)]">
                <Icon className="h-5 w-5 drenyra-text-accent" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  {layer.title}
                  <span className="ml-3 font-mono text-xs tracking-wider text-muted-foreground/50">
                    layer {index + 1}
                  </span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {layer.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground/40">
                  {layer.flow}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/landing && bun run typecheck`
Expected: 0 errors (only the 8 pre-existing lint errors, not type errors)

- [ ] **Step 3: Commit**

```bash
git add apps/landing/components/seguridad/seguridad-arch-diagram.tsx
git commit -m "feat(seguridad): add SeguridadArchDiagram SVG component"
```

---

### Task 2: Update SeguridadPage composition

**Files:**
- Modify: `app/seguridad/seguridad-page.tsx` — full rewrite of the JSX

- [ ] **Step 1: Read current seguridad-page.tsx**

Read `apps/landing/app/seguridad/seguridad-page.tsx` fully to understand the current imports and SectionHeader usage.

- [ ] **Step 2: Write updated seguridad-page.tsx**

Replace entire file content. Key changes:

**Hero section** — add CSS dot-grid background and ambient glow around the existing content:
```tsx
{/* Hero */}
<section className="relative overflow-hidden border-b landing-border px-6 py-24 md:py-32 lg:py-36">
  {/* Dot-grid background */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage: `radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
    }}
    aria-hidden="true"
  />
  {/* Ambient glow */}
  <div
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-foreground/[0.04] blur-[120px]"
    aria-hidden="true"
  />
  <SectionContainer>
    <ScrollReveal>
      <span className="inline-flex items-center gap-2 rounded-full border landing-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 drenyra-text-accent" aria-hidden />
        {hero.tagline}
      </span>
    </ScrollReveal>
    <ScrollReveal delay={0.1}>
      <h1 className="mt-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-foreground">
        {hero.headline}{" "}
        <GradientText>{hero.headlineEmphasis}</GradientText>
      </h1>
    </ScrollReveal>
    <ScrollReveal delay={0.2}>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        {hero.subhead}
      </p>
    </ScrollReveal>
  </SectionContainer>
</section>
```

**Pillars section** — same copy, larger icon (increase from default md to lg):
```tsx
{/* Pillars */}
<section className="border-b landing-border px-6 py-20 md:py-28">
  <SectionContainer>
    <ScrollReveal>
      <SectionHeader tagline={pillars.tagline} headline={pillars.headline} />
    </ScrollReveal>
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {pillars.items.map((item, index) => {
        const Icon = PILLAR_ICONS[item.icon as keyof typeof PILLAR_ICONS];
        return (
          <ScrollReveal key={item.key} delay={index * 0.08}>
            <div className="flex h-full flex-col rounded-2xl border landing-border bg-[var(--drenyra-card)] p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border landing-border bg-[var(--drenyra-accent-muted)]">
                <Icon className="h-5 w-5 drenyra-text-accent" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  </SectionContainer>
</section>
```

**Architecture section** — replace `SectionHeader` + `FeatureCard` grid with `SeguridadArchDiagram`:
```tsx
{/* Architecture diagram */}
<section className="border-b landing-border px-6 py-20 md:py-28">
  <SectionContainer>
    <ScrollReveal>
      <SectionHeader tagline={architecture.tagline} headline={architecture.headline} />
    </ScrollReveal>
    <ScrollReveal delay={0.1}>
      <div className="mt-10">
        <SeguridadArchDiagram />
      </div>
    </ScrollReveal>
  </SectionContainer>
</section>
```

**Certifications section** — larger icons (w-16 h-16), subtle glow/shadow:
```tsx
{/* Certifications */}
<section className="border-b landing-border px-6 py-20 md:py-28">
  <SectionContainer>
    <ScrollReveal>
      <SectionHeader tagline={certBadges.tagline} />
    </ScrollReveal>
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {certBadges.items.map((item, index) => {
        const Icon = CERT_ICONS[index];
        return (
          <ScrollReveal key={item.title} delay={index * 0.1}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border landing-border bg-[var(--drenyra-accent-muted)] shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
                <Icon className="h-7 w-7 drenyra-text-accent" aria-hidden />
              </div>
              <h3 className="mt-5 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  </SectionContainer>
</section>
```

**Trust CTA section** — keep same, just ensure consistent spacing:
```tsx
{/* Trust CTA */}
<section className="px-6 py-20 md:py-28">
  {/* ...existing content unchanged... */}
</section>
```

Full complete file to write:

```tsx
"use client";

import type { ReactElement } from "react";
import {
  ArrowRight,
  Calculator,
  Database,
  FileText,
  Fingerprint,
  Sparkles,
  ShieldCheck,
  Award,
  FileCheck,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { GradientText } from "@/components/ui/gradient-text";
import { SeguridadArchDiagram } from "@/components/seguridad/seguridad-arch-diagram";
import { SEGURIDAD_COPY } from "@/lib/landing/copy/v2/seguridad";

const { hero, pillars, architecture, certBadges, trustCta } = SEGURIDAD_COPY;

const PILLAR_ICONS = {
  shield: Fingerprint,
  calculator: Calculator,
  "file-check": FileText,
  database: Database,
} as const;

const CERT_ICONS = [ShieldCheck, Award, FileCheck] as const;

export function SeguridadPage(): ReactElement {
  return (
    <>
      {/* Hero — cinematic */}
      <section className="relative overflow-hidden border-b landing-border px-6 py-24 md:py-32 lg:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-foreground/[0.04] blur-[120px]"
          aria-hidden="true"
        />
        <SectionContainer>
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border landing-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 drenyra-text-accent" aria-hidden />
              {hero.tagline}
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="mt-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-foreground">
              {hero.headline}{" "}
              <GradientText>{hero.headlineEmphasis}</GradientText>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {hero.subhead}
            </p>
          </ScrollReveal>
        </SectionContainer>
      </section>

      {/* Pillars — polished 4-card */}
      <section className="border-b landing-border px-6 py-20 md:py-28">
        <SectionContainer>
          <ScrollReveal>
            <SectionHeader tagline={pillars.tagline} headline={pillars.headline} />
          </ScrollReveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pillars.items.map((item, index) => {
              const Icon = PILLAR_ICONS[item.icon as keyof typeof PILLAR_ICONS];
              return (
                <ScrollReveal key={item.key} delay={index * 0.08}>
                  <div className="flex h-full flex-col rounded-2xl border landing-border bg-[var(--drenyra-card)] p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border landing-border bg-[var(--drenyra-accent-muted)]">
                      <Icon className="h-5 w-5 drenyra-text-accent" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </SectionContainer>
      </section>

      {/* Architecture diagram — centerpiece */}
      <section className="border-b landing-border px-6 py-20 md:py-28">
        <SectionContainer>
          <ScrollReveal>
            <SectionHeader tagline={architecture.tagline} headline={architecture.headline} />
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mt-10">
              <SeguridadArchDiagram />
            </div>
          </ScrollReveal>
        </SectionContainer>
      </section>

      {/* Certifications — improved badges */}
      <section className="border-b landing-border px-6 py-20 md:py-28">
        <SectionContainer>
          <ScrollReveal>
            <SectionHeader tagline={certBadges.tagline} />
          </ScrollReveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {certBadges.items.map((item, index) => {
              const Icon = CERT_ICONS[index];
              return (
                <ScrollReveal key={item.title} delay={index * 0.1}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border landing-border bg-[var(--drenyra-accent-muted)] shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
                      <Icon className="h-7 w-7 drenyra-text-accent" aria-hidden />
                    </div>
                    <h3 className="mt-5 text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </SectionContainer>
      </section>

      {/* Trust CTA */}
      <section className="px-6 py-20 md:py-28">
        <SectionContainer>
          <ScrollReveal className="text-center">
            <p className="text-sm font-medium text-muted-foreground">{trustCta.tagline}</p>
            <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-foreground">
              <GradientText>{trustCta.headline}</GradientText>
            </h2>
            <div className="mt-8">
              <Link
                href={trustCta.ctaHref}
                className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {trustCta.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </ScrollReveal>
        </SectionContainer>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Add missing imports**

The updated file needs `Link` from `next/link` added to the import block:

```tsx
import Link from "next/link";
```

- [ ] **Step 4: Verify typecheck and lint**

Run: `cd apps/landing && bun run typecheck`
Expected: 0 type errors (8 pre-existing lint errors expected)

- [ ] **Step 5: Commit**

```bash
git add apps/landing/app/seguridad/seguridad-page.tsx
git commit -m "feat(seguridad): update SeguridadPage with cinematic hero and arch diagram"
```

---

### Task 3: Full verification

**Files:** None — verify the entire landing build

- [ ] **Step 1: Run typecheck**

Run: `cd apps/landing && bun run typecheck`
Expected: 0 errors

- [ ] **Step 2: Run lint**

Run: `cd apps/landing && bun run lint`
Expected: 0 new errors (8 pre-existing lint errors in product-capability-card.tsx are ok)

- [ ] **Step 3: Run build**

Run: `cd apps/landing && bun run build`
Expected: all pages prerendered successfully

- [ ] **Step 4: Verify routes**

Confirm `/seguridad` renders. Check:
- `app/seguridad/page.tsx` still has correct metadata, Navbar, Footer
- `app/seguridad/seguridad-page.tsx` exports match what page.tsx expects

---

## Spec Coverage

| Spec requirement | Task |
|-----------------|------|
| SVG layered architecture diagram | Task 1 |
| Cinematic hero with dot-grid + ambient glow | Task 2 (Hero section) |
| Pillars with enhanced cards | Task 2 (Pillars section) |
| Architecture section replaces FeatureCard grid | Task 2 (Architecture section) |
| Certifications with larger icons + glow | Task 2 (Certifications section) |
| Trust CTA refined | Task 2 (Trust CTA section) |
| No external dependencies | All inline SVG + CSS |
| Dark theme preserved | All tokens unchanged |
| Animations via ScrollReveal only | All sections use ScrollReveal |
