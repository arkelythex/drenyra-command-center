# Homepage Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/` to sell Arkelythex as ecosystem/infrastructure with cinematic hero + data narrative + clean product entry points.

**Architecture:** Keep existing dark cinematic foundation. Replace 3 full-bleed product rows with a stats section and product entry grid. Add subtle data strip to hero. Delete unused components.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, Framer Motion

---

### Task 1: Update brand-home copy

**Files:**
- Modify: `apps/landing/lib/landing/copy/v2/brand-home.ts`

- [ ] **Step 1: Add stats data and product entry copy**

```typescript
/**
 * Copy mínimo para la home de marca (/).
 * La narrativa principal vive en visuales, no en párrafos.
 *
 * Multimedia: `lib/landing/brand-media.ts` · archivos en `public/brand/home/`.
 */

export const BRAND_HOME_COPY = {
	hero: {
		eyebrow: "Arkelythex",
		headline: "Infraestructura fiscal.",
		ctaPrimary: "Explorar Drenyra",
		ctaPrimaryHref: "/drenyra",
		ctaSecondary: "API Docs",
		ctaSecondaryHref: "/api",
		metrics: [
			{ label: "empresas fiscales", value: "+250" },
			{ label: "transacciones / día", value: "50K+" },
			{ label: "uptime", value: "99,9%" },
		] as const,
	},

	stats: {
		mission: "La infraestructura que conecta operaciones fiscales en Perú.",
		items: [
			{ value: "250+", label: "empresas integradas" },
			{ value: "15M+", label: "comprobantes procesados" },
			{ value: "99,9%", label: "uptime operacional" },
			{ value: "3", label: "productos core" },
		] as const,
	},

	products: [
		{
			id: "drenyra",
			title: "Drenyra",
			eyebrow: "Command center",
			description: "Coordina agentes, prevalidación y compuertas de aprobación humana.",
			href: "/drenyra",
		},
		{
			id: "ledger",
			title: "Ledger",
			eyebrow: "Accounting control",
			description: "Asientos, revisión y trazas contables con contexto de cada decisión.",
			href: "/ledger",
		},
		{
			id: "cortex",
			title: "Cortex",
			eyebrow: "Fiscal intelligence",
			description: "Modelos y datos para decisiones fiscales informadas.",
			href: "/cortex",
		},
	] as const,

	ecosystem: {
		eyebrow: "Ecosistema",
		items: [
			{ title: "Studio", href: "/studio", mediaId: "studio" as const },
			{ title: "SIRE", href: "/sire", mediaId: "sire" as const },
			{ title: "Seguridad", href: "/seguridad", mediaId: "seguridad" as const },
			{ title: "API Docs", href: "/api", mediaId: "api" as const },
			{ title: "Gov", href: "/gov", mediaId: "gov" as const, roadmap: true },
			{ title: "Grid", href: "/grid", mediaId: "grid" as const, roadmap: true },
		] as const,
	},
} as const;
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/landing/lib/landing/copy/v2/brand-home.ts
git commit -m "feat(home): add stats and product entry copy"
```

---

### Task 2: Create Stats/Mission Strip component

**Files:**
- Create: `apps/landing/components/landing/brand/brand-stats-strip.tsx`
- Modify: `apps/landing/components/landing/brand/index.ts` (barrel export if exists)

- [ ] **Step 1: Create BrandStatsStrip component**

```tsx
"use client";

import type { ReactElement } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/v2/brand-home";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

export function BrandStatsStrip(): ReactElement {
	const { stats } = BRAND_HOME_COPY;

	return (
		<section className="border-y border-border/10 py-20 md:py-24">
			<div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>Misión</p>
					<h2 className="mt-4 max-w-3xl text-balance text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground">
						{stats.mission}
					</h2>
				</ScrollReveal>
				<div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
					{stats.items.map((item, index) => (
						<ScrollReveal key={item.label} delay={index * 0.05}>
							<div className="text-center md:text-left">
								<p className="font-mono text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-foreground">
									{item.value}
								</p>
								<p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
									{item.label}
								</p>
							</div>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/landing/components/landing/brand/brand-stats-strip.tsx
git commit -m "feat(home): add BrandStatsStrip component with Palantir-style data narrative"
```

---

### Task 3: Create Product Grid component

**Files:**
- Create: `apps/landing/components/landing/brand/brand-product-grid.tsx`

- [ ] **Step 1: Create BrandProductGrid component**

```tsx
"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/v2/brand-home";
import {
	LANDING_EYEBROW_CLASS,
	LANDING_BODY_MUTED_CLASS,
} from "@/lib/landing/ui-classes";

export function BrandProductGrid(): ReactElement {
	const { products } = BRAND_HOME_COPY;

	return (
		<section
			id="drenyra"
			className="scroll-mt-28 py-20 md:py-28"
			aria-labelledby="products-title"
		>
			<div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>Productos</p>
					<h2 id="products-title" className="sr-only">
						Productos Arkelythex
					</h2>
				</ScrollReveal>
				<div className="mt-10 grid gap-4 md:grid-cols-3">
					{products.map((product, index) => (
						<ScrollReveal key={product.id} delay={index * 0.06}>
							<Link
								href={product.href}
								className="group flex h-full flex-col rounded-2xl border border-border/20 bg-[var(--card)] p-6 shadow-sm transition-colors hover:border-primary/30"
							>
								<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
									{product.eyebrow}
								</p>
								<h3 className="mt-3 text-xl font-semibold text-foreground">
									{product.title}
								</h3>
								<p className={`mt-2 flex-1 text-sm ${LANDING_BODY_MUTED_CLASS}`}>
									{product.description}
								</p>
								<span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
									Explorar
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
								</span>
							</Link>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/landing/components/landing/brand/brand-product-grid.tsx
git commit -m "feat(home): add BrandProductGrid component replacing full-bleed showcase rows"
```

---

### Task 4: Update Hero with metrics strip

**Files:**
- Modify: `apps/landing/components/sections/hero.tsx`

- [ ] **Step 1: Add metrics strip below hero content**

Replace the current hero.tsx return statement to include a metrics strip at the bottom of the hero viewport. The key change is adding a `div` after the CTA nav and before the `<HeroScrollCue />`:

```tsx
"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { ArkelythexMark } from "@/components/brand/arkelythex-mark";
import { BrandSurfaceScene } from "@/components/landing/brand/brand-surface-scene";
import { HeroScrollCue } from "@/components/landing/hero-scroll-cue";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/v2/brand-home";
import {
	LANDING_EYEBROW_CLASS,
	LANDING_LINK_CLASS,
} from "@/lib/landing/ui-classes";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useAnalytics } from "@/lib/use-analytics";

export function LandingHero(): ReactElement {
	const { hero } = BRAND_HOME_COPY;
	const { trackSireFunnelClick } = useAnalytics();
	const reduceMotion = useReducedMotion();

	const fade = reduceMotion
		? { initial: false, animate: {} }
		: {
				initial: { opacity: 0, y: 16 },
				animate: { opacity: 1, y: 0 },
			};

	return (
		<section
			id="producto"
			className="landing-hero relative min-h-[100svh] overflow-hidden border-b landing-border"
			aria-label="Arkelythex: propuesta de valor"
		>
			<div className="absolute inset-0 min-h-[58vh] md:min-h-[65vh]">
				<BrandSurfaceScene kind="hero" className="h-full min-h-full" priority />
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background"
					aria-hidden
				/>
			</div>

			<motion.div
				className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pb-24 pt-32 sm:px-8 md:min-h-[100svh] md:pb-28 md:pt-40 lg:px-10"
				initial={fade.initial}
				animate={fade.animate}
				transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
			>
				<div className="mt-auto md:max-w-2xl">
					<div className="mb-8 flex items-center gap-4">
						<ArkelythexMark className="text-foreground" size={44} />
						<p className={LANDING_EYEBROW_CLASS}>{hero.eyebrow}</p>
					</div>
					<h1 className="text-balance text-[clamp(2.75rem,9vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground">
						{hero.headline}
					</h1>
					<nav
						className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
						aria-label="Acciones principales"
					>
						<Link
							href={hero.ctaPrimaryHref}
							onClick={() => trackSireFunnelClick("hero_primary")}
							className={`${LANDING_LINK_CLASS} group`}
						>
							<span>{hero.ctaPrimary}</span>
							<ArrowRight
								className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
								aria-hidden
							/>
						</Link>
						<Link
							href={hero.ctaSecondaryHref}
							className={`${LANDING_LINK_CLASS} text-muted-foreground hover:text-foreground`}
						>
							<span>{hero.ctaSecondary}</span>
							<ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
						</Link>
					</nav>
				</div>

				{/* Metrics strip — Palantir data narrative */}
				<div className="mt-auto hidden gap-x-10 gap-y-2 pt-16 md:flex">
					{hero.metrics.map((metric) => (
						<div key={metric.label} className="flex items-baseline gap-2">
							<span className="font-mono text-2xl font-bold tracking-tight text-foreground">
								{metric.value}
							</span>
							<span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
								{metric.label}
							</span>
						</div>
					))}
				</div>
			</motion.div>

			<HeroScrollCue />
		</section>
	);
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/landing/components/sections/hero.tsx
git commit -m "feat(home): add metrics data strip to hero section"
```

---

### Task 5: Update LandingPage composition

**Files:**
- Modify: `apps/landing/components/landing/landing-page.tsx`
- Delete: `apps/landing/components/landing/brand/brand-showcase-row.tsx`

- [ ] **Step 1: Rewrite landing-page.tsx with new section order**

Replace the import of `BrandShowcaseRow` with `BrandStatsStrip` and `BrandProductGrid`. Keep everything else:

```tsx
"use client";

import type { ReactElement } from "react";

import { Navbar } from "@/components/navbar";
import { BrandEcosystemGrid } from "@/components/landing/brand/brand-ecosystem-grid";
import { BrandProductGrid } from "@/components/landing/brand/brand-product-grid";
import { BrandStatsStrip } from "@/components/landing/brand/brand-stats-strip";
import { LandingHero } from "@/components/sections/hero";
import { LandingClosing } from "@/components/sections/closing";
import { LandingFaq } from "@/components/landing/landing-faq";

export function LandingPage(): ReactElement {
	return (
		<>
			<Navbar />
			<main
				id="main-content"
				tabIndex={-1}
				className="landing-canvas relative min-h-screen bg-background text-foreground outline-none selection:bg-foreground/20 selection:text-foreground"
			>
				<div className="relative">
					<LandingHero />
					<BrandStatsStrip />
					<BrandProductGrid />
					<BrandEcosystemGrid />
					<LandingFaq />
					<LandingClosing brandPresentation />
				</div>
			</main>
		</>
	);
}
```

- [ ] **Step 2: Delete BrandShowcaseRow**

Run: `rm apps/landing/components/landing/brand/brand-showcase-row.tsx`

- [ ] **Step 3: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run lint --filter=landing`
Expected: No new errors (pre-existing lint issues may remain)

- [ ] **Step 4: Commit**

```bash
git add apps/landing/components/landing/landing-page.tsx
git rm apps/landing/components/landing/brand/brand-showcase-row.tsx
git commit -m "feat(home): new section composition with stats, product grid, ecosystem"
```

---

### Task 6: Clean up unused media types

**Files:**
- Modify: `apps/landing/lib/landing/brand-media.ts`

- [ ] **Step 1: Remove unused product surface media entries**

Since `BrandShowcaseRow` is gone, the product surface images (`drenyra`, `ledger`, `cortex`) are no longer used by the homepage. Keep `hero` only and narrow the type:

```typescript
export type BrandHomeSurfaceId = "hero";

export const BRAND_HOME_SURFACE_MEDIA: Record<
	BrandHomeSurfaceId,
	BrandMediaAsset
> = {
	hero: {
		src: `${BRAND_HOME_MEDIA_BASE}/hero.webp`,
		alt: "Arkelythex — plataforma fiscal",
	},
};
```

- [ ] **Step 2: Verify build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/landing/lib/landing/brand-media.ts
git commit -m "refactor(home): remove unused product surface media types"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full typecheck**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run typecheck --filter=landing`
Expected: All clean

- [ ] **Step 2: Full lint**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run lint --filter=landing`
Expected: No new errors

- [ ] **Step 3: Build**

Run: `cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex && bun run build --filter=landing`
Expected: Build succeeds
