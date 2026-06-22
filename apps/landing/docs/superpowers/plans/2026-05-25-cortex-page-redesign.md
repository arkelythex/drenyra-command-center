# Cortex Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Redesign the Cortex product page with amber/signal-intelligence theme, SVG signal flow diagram, and cinematic hero.

**Architecture:** New `CortexSignalFlow` inline SVG component replaces `ProductCapabilitiesGrid`. `cortex-page.tsx` rewritten with cinematic hero (CSS dot-grid + amber glow + signal bars), enhanced Command View (2x2 grid), and amber-themed checkpoints. Shared `Product*` components remain untouched.

**Tech Stack:** React 19, Next.js 15, TypeScript, Tailwind CSS 4, Lucide icons, inline SVG.

---

### Task 1: Create CortexSignalFlow component

**Files:**
- Create: `apps/landing/components/cortex/cortex-signal-flow.tsx`

**Description:** Inline SVG diagram component showing 3 horizontal nodes (Detectar → Analizar → Actuar) connected by arrow paths. Each node has an icon box, title, and description. Responsive: horizontal on `md+`, stacks vertically on mobile with connectors.

**Data source:** Uses `CORTEX_COPY.capabilities.items` — the 3 items (Target/GitBranch/ListChecks with their titles and descriptions).

**Steps:**

- [ ] **Step 1: Create the component file**

Create `apps/landing/components/cortex/cortex-signal-flow.tsx`:

```tsx
"use client";

import type { ReactElement } from "react";
import { Target, GitBranch, ListChecks, ArrowRight, ArrowDown } from "lucide-react";
import { CORTEX_COPY } from "@/lib/landing/copy/v2/cortex";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const FLOW_ICONS = [Target, GitBranch, ListChecks] as const;
const FLOW_LABELS = ["Detectar", "Analizar", "Actuar"] as const;

export function CortexSignalFlow(): ReactElement {
  const { items } = CORTEX_COPY.capabilities;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="landing-eyebrow">{CORTEX_COPY.capabilities.tagline}</p>
          <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground md:text-6xl">
            {CORTEX_COPY.capabilities.headline}
          </h2>
        </div>

        {/* Horizontal layout on md+, vertical on mobile */}
        <div className="flex flex-col items-center gap-0 md:flex-row md:items-start md:gap-0">
          {items.map((item, index) => {
            const Icon = FLOW_ICONS[index] ?? Target;
            const isLast = index === items.length - 1;

            return (
              <div key={item.title} className="flex flex-col items-center md:flex-1">
                <ScrollReveal delay={index * 0.08} className="w-full">
                  <div className="mx-auto max-w-xs rounded-2xl border border-amber-500/15 bg-gradient-to-b from-amber-500/5 to-background p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                      <Icon className="h-6 w-6 text-amber-400" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {FLOW_LABELS[index]}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-amber-400/70">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>

                {!isLast && (
                  <>
                    {/* Desktop arrow */}
                    <div className="hidden items-center py-4 md:flex" aria-hidden>
                      <ArrowRight className="h-5 w-5 text-amber-400/40" />
                    </div>
                    {/* Mobile arrow */}
                    <div className="flex items-center py-2 md:hidden" aria-hidden>
                      <ArrowDown className="h-5 w-5 text-amber-400/40" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/apps/landing && bunx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/landing/components/cortex/cortex-signal-flow.tsx
git commit -m "feat(cortex): add CortexSignalFlow component"
```

---

### Task 2: Update cortex-page.tsx

**Files:**
- Modify: `apps/landing/app/cortex/cortex-page.tsx`

**Description:** Rewrite the page composition with:
1. Cinematic hero: CSS dot-grid background + amber ambient glow + 3 decorative signal bars
2. Replace `ProductCapabilitiesGrid` with `<CortexSignalFlow />`
3. Keep `ProductCheckpoints` with amber-colored check icons
4. Enhanced Command View section: 2x2 grid on md+, amber border glow on hover cards
5. Keep `ProductEcosystem` unchanged

**Hero — signal bars decoration:**
```tsx
{/* Signal bars decoration */}
<div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2" aria-hidden>
  {[1, 2, 3].map((i) => (
    <div
      key={i}
      className="h-0.5 rounded-full bg-amber-400/20"
      style={{
        width: `${40 + i * 20}px`,
        animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`,
      }}
    />
  ))}
</div>
```

**Hero — dot-grid + amber glow:**
```tsx
{/* Dot grid */}
<div
  className="pointer-events-none absolute inset-0 opacity-[0.03]"
  style={{
    backgroundImage: `radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)`,
    backgroundSize: "24px 24px",
  }}
  aria-hidden="true"
/>
{/* Amber glow */}
<div
  className="pointer-events-none absolute left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/[0.04] blur-[120px]"
  aria-hidden="true"
/>
```

**Checkpoints** need amber icons. Since `ProductCheckpoints` uses `text-product-accent`, we can either:
- Modify the component to accept a custom icon color (but that modifies shared component)
- Or inline the checkpoints section to use amber

Let's inline the checkpoints section to avoid modifying shared components. Use same pattern as ProductCheckpoints but with amber icons.

**Command View** — enhanced to 2x2 grid:
```tsx
{/* Command view — enhanced */}
<section className="py-20 md:py-28">
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <ScrollReveal>
      <div className="rounded-3xl border border-amber-500/10 bg-gradient-to-b from-amber-500/[0.03] to-background p-8 md:p-12">
        <p className="landing-eyebrow">{command.tagline}</p>
        <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground md:text-5xl">
          {command.headline}
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {command.description}
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {command.items.map((item) => {
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon] ?? LucideIcons.Brain;
            return (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-2xl border border-amber-500/10 bg-background/55 p-5 transition-colors hover:border-amber-500/30 hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.08)]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/10">
                  <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                </div>
                <span className="font-semibold text-foreground/80">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  </div>
</section>
```

**Full page rewrite structure:**
```tsx
"use client";

import type { ReactElement } from "react";
import * as LucideIcons from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { CORTEX_COPY } from "@/lib/landing/copy/v2/cortex";
import { ProductHero } from "@/components/product/product-hero";
import { ProductPanel } from "@/components/product/product-panel";
import { ProductEcosystem } from "@/components/product/product-ecosystem";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CortexSignalFlow } from "@/components/cortex/cortex-signal-flow";

export function CortexPage(): ReactElement {
  const hero = CORTEX_COPY.hero;
  const panel = CORTEX_COPY.heroPanel;
  const readiness = CORTEX_COPY.readiness;
  const command = CORTEX_COPY.commandView;
  const eco = CORTEX_COPY.ecosystem;

  return (
    <div className="cortex-terminal-intelligence">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-foreground/5 pb-20 pt-32 md:pb-28 md:pt-40">
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
        {/* Amber glow */}
        <div
          className="pointer-events-none absolute left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/[0.04] blur-[120px]"
          aria-hidden="true"
        />
        {/* Signal bars */}
        <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2" aria-hidden="true">
          {[40, 60, 80].map((w, i) => (
            <div
              key={i}
              className="h-0.5 rounded-full bg-amber-400/20"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:items-end lg:px-8 relative z-10">
          <div className="lg:col-span-2">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/10 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                {hero.tagline}
              </span>
              <h1 className="mt-6 text-balance font-display text-display-ds font-black text-foreground md:text-hero-ds">
                {hero.headline}
                <br />
                <span className="text-amber-400">{hero.headlineEmphasis}</span>
              </h1>
              <p className="landing-body-muted mt-8 max-w-2xl">{hero.subhead}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={hero.ctaPrimaryHref}
                  className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  {hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href={hero.ctaSecondaryHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-foreground/85 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-foreground"
                >
                  {hero.ctaSecondary}
                </Link>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.12}>
            <ProductPanel label={panel.label} status={panel.status} entries={panel.entries} />
          </ScrollReveal>
        </div>
      </section>

      {/* Signal flow — replaces Capabilities grid */}
      <CortexSignalFlow />

      {/* Requirements — amber themed checklist */}
      <section className="border-y border-amber-500/5 bg-amber-500/[0.02] py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="landing-eyebrow">{readiness.tagline}</p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground md:text-5xl">
              {readiness.headline}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:col-span-2">
            {readiness.items.map((item) => (
              <ScrollReveal key={item}>
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-background/55 p-5">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-semibold leading-relaxed text-foreground/85">
                    {item}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Command view — enhanced with 2x2 grid and amber glow */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="rounded-3xl border border-amber-500/10 bg-gradient-to-b from-amber-500/[0.03] to-background p-8 md:p-12">
              <p className="landing-eyebrow">{command.tagline}</p>
              <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground md:text-5xl">
                {command.headline}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {command.description}
              </p>
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {command.items.map((item) => {
                  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon] ?? LucideIcons.Brain;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 rounded-2xl border border-amber-500/10 bg-background/55 p-5 transition-colors hover:border-amber-500/30 hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.08)]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/10">
                        <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                      </div>
                      <span className="font-semibold text-foreground/80">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Ecosystem */}
      <ProductEcosystem tagline={eco.tagline} headline={eco.headline} links={eco.links} />
    </div>
  );
}
```

- [ ] **Step 1: Write `cortex-page.tsx`**

Replace the file with the implementation above.

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/apps/landing && bunx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/apps/landing && bun run build`
Expected: 0 errors, all routes prerendered.

- [ ] **Step 4: Commit**

```bash
git add apps/landing/app/cortex/cortex-page.tsx
git commit -m "feat(cortex): redesign page with amber theme and signal flow"
```

---

### Task 3: Full verification

- [ ] **Step 1: Run typecheck**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/apps/landing && bunx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/apps/landing && bun run build`
Expected: 0 errors, all routes prerendered.
