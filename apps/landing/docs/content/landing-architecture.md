# Landing architecture (2026-05)

Technical map of `apps/landing` after the brand refresh, Drenyra/API surfaces, and conversion-chrome split.

## Stack

- **Next.js 16** App Router (`app/`)
- **React 19**, Tailwind 4 semantic tokens (`app/globals.css`)
- **Copy:** typed modules under `lib/landing/copy/v2/`
- **Deploy:** Vercel — root `vercel.json` points build to monorepo `landing:build`

## Route → implementation

| Route | Entry | Main components | Copy module |
|-------|--------|-----------------|-------------|
| `/` | `app/page.tsx` → `LandingPage` | `sections/hero`, `landing/brand/*`, `landing-faq`, `sections/closing` | `brand-home.ts` |
| `/drenyra` | `app/drenyra/page.tsx` → `drenyra-page.tsx` | `drenyra/drenyra-hero-media`, `drenyra-workflow-panel`, `drenyra-workspace-preview`, `drenyra-trusted-strip` | `drenyra-engine.ts` |
| `/api` | `app/api/page.tsx` → `api-page.tsx` | `api/ApiDocsShell`, `api/ApiDocsSidebar` | inline + `api-docs-nav.ts` |
| Product/funnel | `app/{ledger,studio,...}/page.tsx` | per-page layouts + shared chrome | `copy/v2/*.ts` |
| `/docs/*` | `app/docs/**` | `docs/DocsChrome`, `DocsSidebar` | `lib/data/docs/*` |

## Site chrome & CTAs

`lib/landing/site-chrome.ts` controls global client islands in `components/public-client-islands.tsx`:

| Behavior | Rule |
|----------|------|
| **Brand home** (`/`) | No WhatsApp, no floating demo, no sticky conversion panel |
| **Conversion routes** | `/drenyra`, `/demo`, `/precios`, `/sire`, `/ledger`, `/studio`, `/cortex`, `/seguridad` (+ subpaths) |
| **Docs shell** | `/api`, `/docs/*` — marketing navbar hidden via layout; no floating CTAs |

Floating elements when enabled:

- `components/ui/whatsapp-cta.tsx` — `lib/whatsapp.ts` → `wa.me/51926437404`
- `components/floating-cta-lazy.tsx` — demo / pricing shortcuts
- `components/sticky-cta.tsx` — sticky bar (mobile + desktop panel)

**Ecosystem discovery (sin cambiar la home visual-first):**

- Home grid: 6 tiles (`brand-ecosystem-grid`) — incluye Gov/Grid con etiqueta Roadmap
- Páginas internas: `components/landing/ecosystem-rail.tsx` en el footer (`showEcosystemRail`)
- Enlaces canónicos: `lib/landing/ecosystem-nav.ts`

Tests: `lib/landing/__tests__/site-chrome.test.ts`.

## Home (`/`) composition

```
LandingPage
├── Navbar
├── LandingHero          (sections/hero.tsx + BRAND_HOME_COPY)
├── BrandShowcaseRow × N (landing/brand/brand-showcase-row.tsx)
├── BrandEcosystemGrid   (landing/brand/brand-ecosystem-grid.tsx)
├── LandingFaq           (landing/landing-faq.tsx)
└── LandingClosing       (sections/closing.tsx, brandPresentation)
```

Section anchors for in-page nav: `lib/landing/v2-section-registry.ts` (`#producto`, `#drenyra`, `#ecosistema`, `#faq`, …).

Optional home modules (used on other surfaces or future home variants):

- `landing/capability-marquee.tsx`
- `landing/brand-proof-strip.tsx`
- `landing/hero-scroll-cue.tsx`
- `landing/product-surface-panel.tsx`

## Brand media pipeline

| Layer | Path |
|-------|------|
| Files on disk | `public/brand/home/*.webp`, `ecosystem/*.webp` |
| URL constants | `lib/landing/brand-media.ts` |
| Slot UI | `components/landing/brand/brand-media-slot.tsx` |
| Scenes | `brand-surface-scene.tsx`, `brand-showcase-row.tsx`, `brand-ecosystem-grid.tsx` |

Until assets exist, slots render neutral `#0a0a0a` (no fake UI mocks). See [`visuals.md`](./visuals.md).

## Drenyra page (`/drenyra`)

| Component | Role |
|-----------|------|
| `drenyra-hero-media.tsx` | Tabbed workspace / terminal preview |
| `drenyra-terminal-preview.tsx` | Terminal mock UI |
| `drenyra-workspace-preview.tsx` | Command-center mock UI |
| `drenyra-workflow-panel.tsx` | Workflow steps narrative |
| `drenyra-trusted-strip.tsx` | Social proof strip |

Copy source: `lib/landing/copy/v2/drenyra-engine.ts` (exported as `DRENYRA_ENGINE_COPY`).

A11y: `components/__tests__/drenyra-page-a11y.test.tsx`.

## API docs (`/api`)

Extracted from monolithic `api-page.tsx` into:

| File | Role |
|------|------|
| `api/ApiDocsShell.tsx` | Layout, mobile nav, content column |
| `api/ApiDocsSidebar.tsx` | Section nav from `api-docs-nav.ts` |
| `api-docs-nav.ts` | Anchor map — must match `id`s in `api-page.tsx` |

`isDocsEntryPath()` in `site-chrome.ts` treats `/api` like internal docs (no marketing conversion chrome).

Tests: `components/__tests__/api-page-a11y.test.tsx`, `lib/landing/__tests__/api-docs-nav.test.ts`.

## Copy system (`lib/landing/copy/v2/`)

| Module | Used on |
|--------|---------|
| `brand-home.ts` | `/` |
| `drenyra-engine.ts` | `/drenyra` |
| `navbar.ts`, `hero-trust.ts`, `closing.ts` | Navbar, legacy sections, closing |
| `precios.ts`, `demo.ts`, `seguridad.ts`, … | Named routes |

Aggregate export: `index.ts` → `V2_LANDING_COPY` + named exports.

Normative trace (marketing claims): `NORMATIVE_TRACE.md` in the same folder.

## SEO & contact

`lib/seo/config.ts`:

- `url` — from `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL` or `https://arkelythexfounders.com`
- `contactEmail` — public mailto
- `whatsappNumber` — `51926437404` (Business)

## Shared styling

- **Tokens:** `app/globals.css` + `lib/design-system-token-contract.ts`
- **Repeated classes:** `lib/landing/ui-classes.ts` (eyebrows, captions, dividers)
- **Rules:** root [`DESIGN.md`](../../DESIGN.md)

## Testing

```bash
cd apps/landing
bun test                    # vitest — unit + a11y smoke
bun run landing:build       # production build gate before deploy
```

## Deploy checklist

1. `bun run landing:build` passes locally
2. Commit `apps/landing/**`
3. `git push origin main` → Vercel redeploys `arkelythex-landing`
4. Hard refresh production (`Ctrl+Shift+R`)
5. Verify Vercel env: remove `NEXT_PUBLIC_WHATSAPP_NUMBER=51999999999` if present

## Related docs

- [`../README.md`](../README.md) — doc hub
- [`visuals.md`](./visuals.md) — brand assets
- [`../../DESIGN.md`](../../DESIGN.md) — design system
- [`../../public/brand/home/README.md`](../../public/brand/home/README.md) — asset upload paths
