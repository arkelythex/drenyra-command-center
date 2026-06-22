# Componentes

> Índice de componentes React en `apps/landing/components/`.

Arquitectura por rutas y chrome global: [landing-architecture.md](../content/landing-architecture.md).

---

## Por carpeta

### `landing/` — Home de marca

| Export | Archivo | Descripción |
|--------|---------|-------------|
| `LandingPage` | `landing-page.tsx` | Página `/` |
| `LandingFaq` | `landing-faq.tsx` | FAQ |
| `CapabilityMarquee` | `capability-marquee.tsx` | Marquee |
| `BrandProofStrip` | `brand-proof-strip.tsx` | Proof strip |
| `HeroScrollCue` | `hero-scroll-cue.tsx` | Scroll cue |
| `ProductSurfacePanel` | `product-surface-panel.tsx` | Panel producto |

#### `landing/brand/`

| Export | Archivo |
|--------|---------|
| `BrandMediaSlot` | `brand-media-slot.tsx` |
| `BrandSurfaceScene` | `brand-surface-scene.tsx` |
| `BrandShowcaseRow` | `brand-showcase-row.tsx` |
| `BrandEcosystemGrid` | `brand-ecosystem-grid.tsx` |

Media paths: `lib/landing/brand-media.ts`.

### `drenyra/` — Página `/drenyra`

| Export | Archivo |
|--------|---------|
| `DrenyraHeroMedia` | `drenyra-hero-media.tsx` |
| `DrenyraWorkspacePreview` | `drenyra-workspace-preview.tsx` |
| `DrenyraTerminalPreview` | `drenyra-terminal-preview.tsx` |
| `DrenyraWorkflowPanel` | `drenyra-workflow-panel.tsx` |
| `DrenyraTrustedStrip` | `drenyra-trusted-strip.tsx` |

Copy: `DRENYRA_ENGINE_COPY` en `lib/landing/copy/v2/drenyra-engine.ts`.

### `api/` — Página `/api`

| Export | Archivo |
|--------|---------|
| `ApiDocsShell` | `ApiDocsShell.tsx` |
| `ApiDocsSidebar` | `ApiDocsSidebar.tsx` |
| `API_DOCS_NAV_SECTIONS` | `api-docs-nav.ts` |

Anchors en nav deben coincidir con `id` en `app/api/api-page.tsx`.

### `sections/` — Secciones compartidas

| Export | Archivo | Uso típico |
|--------|---------|------------|
| `LandingHero` | `hero.tsx` | Home hero |
| `LandingClosing` | `closing.tsx` | Cierre / CTA |
| `TrustStrip` | `trust-strip.tsx` | SIRE funnel |
| `StatsStrip` | `stats-strip.tsx` | Métricas |

### `navbar/`, `layout/`, `ui/`

| Área | Punto de entrada |
|------|------------------|
| Navbar | `navbar/Navbar.tsx` |
| Footer | `layout/footer.tsx` |
| WhatsApp | `ui/whatsapp-cta.tsx` |
| Tokens UI | `ui/section-container.tsx`, `scroll-reveal.tsx`, … |

### `docs/` — Docs internos `/docs/*`

| Export | Archivo |
|--------|---------|
| `DocsChrome` | `DocsChrome.tsx` |
| `DocsSidebar` | `DocsSidebar.tsx` |

---

## Legacy / referencia histórica

| Componente | Doc | Estado |
|------------|-----|--------|
| `PricingCard` | [pricing-card.md](./pricing-card.md) | Archivo fuente eliminado |
| Motion wrappers | [motion-wrappers.md](./motion-wrappers.md) | Vigente |

Pricing vigente: buscar `V2PricingSection` / `detailed-pricing-section` en el árbol (rutas pueden variar).

---

## Convenciones

- Componentes funcionales + TypeScript
- Props con interfaces exportadas cuando se reutilizan
- Clases condicionales vía `cn()` (`lib/utils.ts`)
- Sin hex hardcoded — usar tokens de `globals.css` / `ui-classes.ts`

---

[← Volver al índice](../README.md)
