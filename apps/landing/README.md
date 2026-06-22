---
last-verified: 2026-06-20
source-of-truth: apps/landing/package.json
auto-generated: false
---

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

# Arkelythex Landing

Canonical marketing app for the Arkelythex ecosystem (`@arkelythex/landing` in the **drenyra** monorepo).

Production: [arkelythexfounders.com](https://arkelythexfounders.com) · Deploy: Vercel (`apps/landing/vercel.json`).

## Purpose

Public marketing and product-discovery surface. Q2 2026 refresh: **monochrome** aesthetic (OpenAI / Anduril), visual-first brand home, dedicated product pages, and docs-style API reference.

## Routes

| Route | Page | Notes |
|-------|------|-------|
| `/` | Brand home | Visual-first; no conversion chrome (WhatsApp / sticky demo) |
| `/drenyra` | Drenyra product | Workflow panel, hero media tabs, workspace preview |
| `/api` | API docs | `ApiDocsShell` + sidebar; no marketing navbar |
| `/ledger`, `/studio`, `/cortex` | Product surfaces | Conversion CTAs enabled |
| `/demo`, `/precios`, `/sire`, `/seguridad` | Funnel pages | Conversion CTAs enabled |
| `/docs/*` | Internal docs | `DocsChrome`; no floating CTAs |
| `/casos-de-exito`, `/nosotros`, `/gov`, `/grid` | Supporting pages | Per-route layout |

Full map, components, and copy: **[`docs/content/landing-architecture.md`](./docs/content/landing-architecture.md)**.

## Development

From monorepo root (`drenyra/`):

```bash
bun run landing:dev
bun run landing:build
bun run landing:start
```

Tests (package):

```bash
cd apps/landing && bun test
```

## Key directories

```text
apps/landing/
├── app/                    # Next.js App Router pages
├── components/
│   ├── landing/            # Home modules (FAQ, marquee, brand/*)
│   ├── drenyra/               # Drenyra page sections
│   ├── api/                # API docs shell + nav
│   ├── navbar/, layout/     # Chrome
│   └── ui/                 # Shared UI (whatsapp-cta, etc.)
├── lib/
│   ├── landing/            # copy/v2, site-chrome, brand-media, ui-classes
│   ├── seo/config.ts       # site URL, WhatsApp canonical number
│   └── whatsapp.ts         # wa.me URLs (ignores placeholder env)
├── public/brand/home/      # Home multimedia (WebP) — see README there
└── docs/                   # Technical documentation
```

## Brand home multimedia

Upload stills under `public/brand/home/`. Register paths in `lib/landing/brand-media.ts`.

- Quick guide: [`public/brand/home/README.md`](./public/brand/home/README.md)
- Media kit doc: [`docs/content/visuals.md`](./docs/content/visuals.md)

## Design system

- Overview: [`DESIGN.md`](./DESIGN.md)
- Tokens: `app/globals.css`, `lib/design-system-token-contract.ts`

## WhatsApp Business

- Canonical number: `+51 926 437 404` (`siteConfig.whatsappNumber` → `51926437404`)
- Floating CTA: `components/ui/whatsapp-cta.tsx` → `lib/whatsapp.ts`
- Shown only on [conversion routes](./lib/landing/site-chrome.ts) (not on `/` or `/docs`)
- Optional override: `NEXT_PUBLIC_WHATSAPP_NUMBER` (placeholders like `51999999999` are ignored)

## Design system

Authoritative tokens and rules: [`DESIGN.md`](./DESIGN.md) · contract: `lib/design-system-token-contract.ts`.

## Documentation index

| Doc | Topic |
|-----|--------|
| [`docs/README.md`](./docs/README.md) | Doc hub |
| [`docs/content/landing-architecture.md`](./docs/content/landing-architecture.md) | Routes, components, copy, CTAs |
| [`docs/content/visuals.md`](./docs/content/visuals.md) | Brand assets & home media |
| [`DESIGN.md`](./DESIGN.md) | Monochrome design system |

## Architectural note

- **Canonical app:** `drenyra/apps/landing` (package `@arkelythex/landing`)
- Legacy path `drenyra/apps/landing` and top-level `arkelythex-landing/` wrappers are deprecated; use `drenyra/` only
