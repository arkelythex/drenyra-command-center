<!-- Manual navigation map for Arkelythex Landing (Next.js 16). See CODEX-MAP.md for monorepo root. -->
# LANDING-MAP — Arkelythex Landing Navigation

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

## Si solo tenés tres minutos

1. **Ubicación**: `apps/landing/` — Next.js 16 marketing app.
2. **Comando para desarrollar**: `bun run landing:dev` (desde la raíz del monorepo).
3. **Lo que más vas a tocar**: rutas en `app/`, componentes en `components/`, copy en `lib/landing/copy/`.
4. **Para navegar rápido**: usá la tabla de rutas abajo y los "Common tasks → exact paths" al final de este MAP.

## Start here
- **Location:** `apps/landing/`
- **Package:** `@arkelythex/landing` v0.1.0
- **Stack:** Next.js 16 + React 19.2 + Tailwind CSS 4 + shadcn/ui (new-york)
- **Runtime:** Bun 1.3.11, Turbopack
- **Build:** `next build` — static export + server API routes (Edge OG, analytics track, newsletter)
- **Tests:** `vitest run` (node env), 19 test files across `lib/__tests__/`, `components/__tests__/`, `lib/landing/__tests__/`
- **Lint:** `eslint .` — strict TS + React hooks + custom `design-tokens/no-off-brand-colors` rule (monochrome only)
- **Design:** Strict monochrome (#0A0A0A near-black, #FAFAFA white, gray structure) — OpenAI/Anduril aesthetic

## Tech stack

| Layer | Technology | Config file |
|-------|-----------|-------------|
| Framework | Next.js 16 (App Router) | `next.config.mjs` |
| React | React 19.2.5 (RSC, Server Components) | `tsconfig.json` |
| Styling | Tailwind CSS 4 + `tw-animate-css` | `postcss.config.mjs` + `app/globals.css` |
| UI | shadcn/ui (new-york) + lucide-react + framer-motion | `components.json` |
| Icons | lucide-react 0.562.0 | — |
| Analytics | Custom `AnalyticsService` + Vercel Analytics + Web Vitals | `lib/analytics.ts` |
| Fonts | Inter (UI), JetBrains Mono (code), Cinzel (display accent) | `app/layout.tsx` |
| Testing | Vitest 4 + happy-dom | `vitest.config.ts` |
| Linting | ESLint flat config + typescript-eslint + react-hooks | `eslint.config.js` |
| Deploy | Vercel (monorepo) | `vercel.json` |
| Image optimization | AVIF + WebP, `minimumCacheTTL: 31536000` | `next.config.mjs` |
| Design tokens | `globals.css` CSS vars + `lib/design-tokens.ts` + `lib/design-system-token-contract.ts` | — |

## Routes / pages

| Route | App Router file | Purpose | Metadata title |
|-------|----------------|---------|----------------|
| `/` | `app/page.tsx` | Home — hero, stats, products, ecosystem, FAQ, closing | Command Center Fiscal para Perú |
| `/sire` | `app/sire/sire-page.tsx` | SIRE-first funnel for monthly close | SIRE + facturación electrónica |
| `/drenyra` | `app/drenyra/drenyra-page.tsx` | Main fiscal workspace agent | Drenyra |
| `/drenyra/terminal` | `app/drenyra/terminal/page.tsx` | CLI terminal sub-page | — |
| `/ledger` | `app/ledger/ledger-page.tsx` | Contable ledger control | Ledger |
| `/studio` | `app/studio/studio-page.tsx` | Accounting firm management | Studio |
| `/cortex` | `app/cortex/cortex-page.tsx` | Fiscal intelligence and risk | Cortex |
| `/seguridad` | `app/seguridad/seguridad-page.tsx` | Security and compliance | Seguridad y Compliance |
| `/precios` | `app/precios/precios-page.tsx` | Pricing plans | Precios |
| `/casos-de-exito` | `app/casos-de-exito/casos-de-exito-page.tsx` | Success stories | Casos de Éxito |
| `/nosotros` | `app/nosotros/nosotros-page.tsx` | About the team | Nosotros |
| `/demo` | `app/demo/demo-page.tsx` | Book a demo | Solicita una demo |
| `/api` | `app/api/api-page.tsx` | API documentation | Infraestructura Tributaria |
| `/gov` | `app/gov/page.tsx` | Gov and compliance (roadmap, noindex) | Arkelythex Gov |
| `/grid` | `app/grid/page.tsx` | Data network (roadmap, noindex) | Arkelythex Grid |
| `/docs/visuals` | `app/docs/visuals/page.tsx` | Brand visuals docs | — |
| `/docs/architecture` | `app/docs/architecture/page.tsx` | Architecture docs | — |
| `/docs/sunat-compliance` | `app/docs/sunat-compliance/page.tsx` | SUNAT compliance docs | — |
| `/docs/sovereign-core` | `app/docs/sovereign-core/page.tsx` | Sovereign core docs | — |
| `/docs/design-system` | `app/docs/design-system/page.tsx` | Design system docs | — |
| `/docs/vision` | `app/docs/vision/page.tsx` | Vision docs | — |
| `/docs/roadmap` | `app/docs/roadmap/page.tsx` | Roadmap docs | — |
| `/docs/investors` | `app/docs/investors/page.tsx` | Investors docs | — |
| `/docs/cbdc-banking` | `app/docs/cbdc-banking/page.tsx` | CBDC banking docs | — |

### API routes (serverless)

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/analytics/track` | `app/api/analytics/track/route.ts` | Analytics tracking endpoint |
| `POST /api/newsletter` | `app/api/newsletter/route.ts` | Newsletter signup |
| `GET /api/og` | `app/api/og/route.tsx` | Edge OG image (monochrome grid + mark) |

### Redirects (permanent 301, from `next.config.mjs`)

| From | To |
|------|----|
| `/v2`, `/v2/:path*` | `/` |
| `/verik`, `/verik/:path*` | `/drenyra` |
| `/kyro` | `/drenyra` |
| `/kyro/:path*` | `/drenyra/:path*` |
| `/flux` | `/ledger` |
| `/firma` | `/studio` |
| `/forge` | `/cortex` |
| `/docs`, `/docs/` | `/api` |

## Architecture layers

```
app/                                  ← App Router (RSC-first)
├── layout.tsx                        Root layout: fonts, Metadata, Viewport, Analytics
├── page.tsx                          Home page (LandingPage composition)
├── template.tsx                      Per-route scroll progress bar (Framer Motion)
├── globals.css                       Tailwind 4 + monochrome CSS custom properties
│
├── {route}/                          ← 12 product/content routes (page.tsx + -page.tsx)
│   └── page.tsx / {route}-page.tsx   Metadata export + "use client" content component
│
├── api/                              ← 3 serverless API routes
│   ├── analytics/track/route.ts
│   ├── newsletter/route.ts
│   └── og/route.tsx
│
└── docs/                             ← 9 docs sub-routes with DocsChrome layout
    ├── layout.tsx                    Docs shell wrapper
    └── {topic}/page.tsx              Content from lib/data/docs/*.ts

components/                           ← React components
├── navbar/                           Navbar: types, constants, hooks, components
├── layout/                           Footer (ecosystem rail, newsletter, social)
├── landing/                          Home composition: page, FAQ, marquee, ecosystem rail, brand surfaces
├── sections/                         Hero, Closing CTA
├── product/                          Terminal-style panels, ecosystem grid
├── drenyra/                          Drenyra-specific: mark SVG, macOS chrome, thought pulse, workspace preview
├── cortex/                           Cortex signal flow diagram
├── sire/                             SIRE funnel tracker
├── seguridad/                        Security arch diagram
├── ui/                               Reusable: ScrollReveal, MouseGlow, SectionContainer, GradientText, Cards
├── brand/                            Brand mark SVG, favicon components
├── docs/                             (docs components)
└── __tests__/                        7 component test files

lib/                                  ← Shared logic (framework-free)
├── analytics.ts                      AnalyticsService (9 event types)
├── analytics-provider.tsx            Suspense-wrapped AnalyticsProvider
├── use-analytics.ts                  "use client" analytics hook
├── logger.ts                         analyticsLogger (debug/info/warn/error)
├── whatsapp.ts                       WhatsApp URL builder (+51 926 437 404)
├── utils.ts                          cn() re-export from @arkelythex/ui
├── design-tokens.ts                  Typography, radius, blur, shadows
├── design-system-token-contract.ts   Token contract types + neutral/semantic tokens
│
├── seo/config.ts                     siteConfig, defaultMetadata, JSON-LD generators
├── types/docs.ts                     Content type definitions
├── hooks/                            7 hooks: focus-trap, count-up, mouse-pos, reduced-motion, etc.
├── constants/copy.ts                 V2_LANDING_COPY re-export
│
├── landing/                          Landing-specific logic
│   ├── site-chrome.ts                Conversion chrome control (floating CTAs, docs shell)
│   ├── section-registry.ts           Section anchors, navbar links
│   ├── section-ids.ts                Body section order constants
│   ├── ecosystem-nav.ts              Ecosystem navigation links
│   ├── brand-media.ts / drenyra-media.ts  Media path helpers
│   ├── motion-presets.ts             Framer Motion presets
│   ├── ui-classes.ts                 Shared Tailwind class fragments
│   └── copy/                         15 copy modules
│
├── data/                             Content data
│   ├── landing-faqs.ts               FAQ data (7 items)
│   ├── docs-nav.ts                   Docs sidebar navigation
│   ├── docs-search-extended.ts       Extended search entries
│   └── docs/                         8 doc content modules
│
└── __tests__/                        9 test files

docs/                                 ← Project documentation (markdown)
├── content/                          6 docs content markdowns
├── components/                       2 component docs markdowns
├── lib/                              2 docs markdowns
├── ui-ux/                            UI/UX guidelines
└── superpowers/plans/ + specs/       3 plans + 3 specs
```

## Docs section structure

| Path | Content source | Layout |
|------|---------------|--------|
| `/api` | Inline `api-page.tsx` + `lib/data/docs/` | DocsChrome (sidebar) |
| `/docs/visuals` | `lib/data/docs/visuals.ts` | DocsChrome |
| `/docs/architecture` | `lib/data/docs/architecture.ts` | DocsChrome |
| `/docs/sunat-compliance` | `lib/data/docs/sunat-compliance.ts` | DocsChrome |
| `/docs/sovereign-core` | `lib/data/docs/sovereign-core.ts` | DocsChrome |
| `/docs/design-system` | `lib/data/docs/design-system.ts` | DocsChrome |
| `/docs/vision` | `lib/data/docs/vision.ts` | DocsChrome |
| `/docs/roadmap` | `lib/data/docs/roadmap.ts` | DocsChrome |
| `/docs/investors` | `lib/data/docs/investors.ts` | DocsChrome |
| `/docs/cbdc-banking` | `lib/data/docs/cbdc-banking.ts` | DocsChrome |

## Key entrypoints

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — fonts, metadata, viewport, analytics provider |
| `app/globals.css` | Tailwind 4 + all CSS custom properties (monochrome token system) |
| `app/page.tsx` | Home page composition |
| `lib/landing/site-chrome.ts` | Conversion chrome control (CTAs visibility per route) |
| `lib/landing/section-registry.ts` | Navbar links + section anchors registry |
| `lib/landing/ui-classes.ts` | Shared Tailwind class fragments for marketing patterns |
| `lib/seo/config.ts` | Metadata defaults, JSON-LD, siteURL resolution |
| `lib/analytics.ts` | Analytics service (9 event types) |
| `lib/design-system-token-contract.ts` | Token contract (must match globals.css) |
| `lib/data/docs-nav.ts` | Docs sidebar navigation tree |
| `components/navbar/constants.ts` | NAV_ITEMS from section-registry |
| `components/public-client-islands.tsx` | Lazy-loaded islands loader |
| `scripts/optimize-images.js` | Asset audit script |
| `DESIGN.md` | Design system rules (monochrome, no warm hues, Inter only) |

## Fast search recipes

```bash
# Find all public page components (the content of each route)
fd -p "app/*/" -d 2 -t d apps/landing/app/ | grep -v api | grep -v docs

# Find all "use client" content components
rg "use client" apps/landing/app/ --type tsx -l

# Find a specific route page metadata
rg "export const metadata" apps/landing/app/*/page.tsx

# Find all test files
fd "(test|spec)\.(ts|tsx)$" apps/landing/ -tf

# Find analytics event calls
rg "analytics\.(track|send)" apps/landing/ --type ts -l

# Find CTA tracking
rg "cta_click" apps/landing/ --type ts

# Find WhatsApp references
rg "whatsapp|926" apps/landing/ -g "!node_modules"

# Find design token violations (hardcoded hex)
rg "#[0-9a-fA-F]{6}" apps/landing/lib/ --type ts

# Find framer-motion usage
rg "motion\.|framer-motion" apps/landing/components/ --type tsx -l

# Find all API route handlers
fd "route.ts" apps/landing/app/api/

# Find redirect references
rg "redirects|destination" apps/landing/next.config.mjs

# Find docs content data
fd -t f apps/landing/lib/data/docs/

# Find site-chrome route decisions
rg "isConversionRoute|isDocsEntryPath|showConversionChrome" apps/landing/lib/
```

## Common tasks → exact paths

| Task | Start path |
|------|-----------|
| Add new route/page | `app/{route}/page.tsx` + `app/{route}/{route}-page.tsx` |
| Change root layout (fonts, metadata) | `app/layout.tsx` |
| Change route metadata/SEO | `app/{route}/page.tsx` (metadata export) |
| Change nav items | `lib/landing/section-registry.ts` + `components/navbar/constants.ts` |
| Change footer | `components/layout/footer.tsx` |
| Change home hero or closing | `components/sections/hero.tsx` or `components/sections/closing.tsx` |
| Change conversion CTAs logic | `lib/landing/site-chrome.ts` |
| Change design tokens (colors, radius) | `app/globals.css` + `lib/design-tokens.ts` + `lib/design-system-token-contract.ts` |
| Change analytics events | `lib/analytics.ts` + `lib/analytics-provider.tsx` |
| Change WhatsApp number | `lib/whatsapp.ts` |
| Change docs content | `lib/data/docs/{topic}.ts` |
| Change docs sidebar nav | `lib/data/docs-nav.ts` |
| Change brand copy (text) | `lib/landing/copy/{module}.ts` |
| Change FAQ data | `lib/data/landing-faqs.ts` |
| Add OG image variation | `app/api/og/route.tsx` |
| Add redirect | `next.config.mjs` (redirects array) |
| Asset audit | `scripts/optimize-images.js` |
| Add/update favicon / brand assets | `public/brand/` |
| Change sitemap | `app/sitemap.ts` |
| Change robots.txt | `app/robots.ts` |
| Change error/404/loading pages | `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` |
| Add UI component (shadcn) | `components/ui/` — use `bunx shadcn@latest add` |
| Add test | `lib/__tests__/` or `components/__tests__/` or `lib/landing/__tests__/` |
| Write project docs | `apps/landing/docs/content/` |

## Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.2.2 | App Router, RSC, SSG, API routes |
| `react` / `react-dom` | 19.2.5 | UI framework |
| `@arkelythex/ui` | workspace:* | Shared UI components (cn()) |
| `@vercel/analytics` | latest | Vercel Analytics |
| `clsx` | ^2.1.1 | Classname utility |
| `tailwind-merge` | ^3.5.0 | Tailwind class merge |
| `framer-motion` | ^12.27.3 | Animation library |
| `lucide-react` | 0.562.0 | Icons |
| `react-markdown` | ^10.1.0 | Markdown rendering (docs) |
| `web-vitals` | ^5.2.0 | Web Vitals reporting |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.1.9 | Utility CSS |
| `@tailwindcss/postcss` | ^4.1.9 | Tailwind PostCSS plugin |
| `postcss` | ^8.5 | CSS processor |
| `tw-animate-css` | 1.4.0 | Animation utilities |
| `typescript` | ^6 | Type checker |
| `vitest` | ^4.1.5 | Test runner |
| `happy-dom` | ^20.9.0 | DOM test env |
| `@testing-library/react` | ^16.0.0 | React test utils |

## CI gates

```bash
bun install --frozen-lockfile        # Install (monorepo root)
bun run build                         # next build (apps/landing)
bun run lint                          # ESLint with design-tokens plugin
bun run test                          # vitest run (19 test files)
```

## Brand assets

| Asset | Path |
|-------|------|
| Mark (SVG, currentColor) | `public/brand/mark.svg` |
| Favicon | `public/brand/favicon.svg` / `icon.svg` |
| Logo SVG | `public/brand/logo.svg` |
| Logo light/dark PNG | `public/brand/logo-light.png` / `logo-dark.png` |
| Emblems | `public/brand/arkelythex/emblem-light-pearl-deboss.png` / `emblem-dark-graphite-emboss.png` |
| Drenyra mark | `public/brand/drenyra/mark-glass.png` |
| Home hero images | `public/brand/home/hero.webp`, `drenyra.webp`, `ledger.webp`, `cortex.webp` |
| Ecosystem tiles | `public/brand/home/ecosystem/` (6 product images) |
| PWA manifest | `public/manifest.json` |
