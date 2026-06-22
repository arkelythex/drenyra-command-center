# Documentación — Arkelythex Landing

> Documentación técnica de `apps/landing` (monorepo **drenyra**).

**Última actualización:** 2026-05-22

---

## Empezar aquí

| Doc | Para quién | Contenido |
|-----|------------|-----------|
| [**Landing architecture**](./content/landing-architecture.md) | Dev / diseño / agentes | Rutas, componentes, CTAs, copy, deploy |
| [**Visuals & media kit**](./content/visuals.md) | Diseño / marketing | Assets `public/brand/home/`, OG, monocromo |
| [**DESIGN.md**](../DESIGN.md) | Diseño | Tokens, reglas monocromo |
| [**README.md**](../README.md) | Onboarding | Comandos, rutas, WhatsApp |

---

## Estructura

```text
docs/
├── README.md                      ← Estás aquí
├── content/
│   ├── landing-architecture.md    ← Mapa técnico (NUEVO)
│   ├── visuals.md
│   ├── architecture.md
│   ├── cbdc-banking.md
│   ├── sovereign-core.md
│   └── sunat-compliance.md
├── components/
│   ├── README.md
│   ├── motion-wrappers.md
│   └── pricing-card.md            # legacy
├── lib/
│   ├── README.md
│   ├── pricing-data.md
│   └── utils.md
└── ui-ux/
    └── LIBRO_DIARIO_GUIDELINES.md
```

---

## Componentes por dominio (vigente)

### Home & marca (`components/landing/`)

| Componente | Archivo | Uso |
|------------|---------|-----|
| `LandingPage` | `landing-page.tsx` | Orquestación `/` |
| `BrandShowcaseRow` | `brand/brand-showcase-row.tsx` | Filas producto Drenyra/Ledger/Cortex |
| `BrandEcosystemGrid` | `brand/brand-ecosystem-grid.tsx` | Tiles Studio/SIRE/API/… |
| `BrandMediaSlot` | `brand/brand-media-slot.tsx` | Slot imagen con fallback neutro |
| `LandingFaq` | `landing-faq.tsx` | FAQ home |
| `CapabilityMarquee` | `capability-marquee.tsx` | Marquee capacidades |
| `BrandProofStrip` | `brand-proof-strip.tsx` | Strip de prueba social |
| `HeroScrollCue` | `hero-scroll-cue.tsx` | Cue scroll hero |
| `ProductSurfacePanel` | `product-surface-panel.tsx` | Panel superficie producto |

### Drenyra (`components/drenyra/`)

| Componente | Archivo |
|------------|---------|
| `DrenyraHeroMedia` | `drenyra-hero-media.tsx` |
| `DrenyraWorkspacePreview` | `drenyra-workspace-preview.tsx` |
| `DrenyraTerminalPreview` | `drenyra-terminal-preview.tsx` |
| `DrenyraWorkflowPanel` | `drenyra-workflow-panel.tsx` |
| `DrenyraTrustedStrip` | `drenyra-trusted-strip.tsx` |

### API docs (`components/api/`)

| Componente | Archivo |
|------------|---------|
| `ApiDocsShell` | `ApiDocsShell.tsx` |
| `ApiDocsSidebar` | `ApiDocsSidebar.tsx` |
| Nav config | `api-docs-nav.ts` |

### Chrome global

| Componente | Archivo | Notas |
|------------|---------|-------|
| `Navbar` | `navbar/Navbar.tsx` | Oculto en `/api` y `/docs` |
| `Footer` | `layout/footer.tsx` | Banner conversión opcional |
| `WhatsAppCTA` | `ui/whatsapp-cta.tsx` | Solo rutas conversión |
| `PublicClientIslands` | `public-client-islands.tsx` | Gating vía `site-chrome.ts` |
| `StickyCta` | `sticky-cta.tsx` | Demo / precios |

Detalle de rutas y gating: [landing-architecture.md](./content/landing-architecture.md#site-chrome--ctas).

---

## Librerías clave (`lib/landing/`)

| Módulo | Rol |
|--------|-----|
| `site-chrome.ts` | Qué rutas muestran WhatsApp / floating CTA |
| `brand-media.ts` | URLs `/brand/home/*` |
| `ui-classes.ts` | Clases marketing reutilizables |
| `v2-section-registry.ts` | Anclas DOM home |
| `copy/v2/*` | Copy por página |
| `../whatsapp.ts` | Enlaces `wa.me` |
| `../seo/config.ts` | Metadata, número WhatsApp canónico |

---

## Contenido legacy / motion

| Componente | Estado | Doc |
|------------|--------|-----|
| `PricingCard` | No existe | [pricing-card.md](./components/pricing-card.md) |
| `FadeInUp`, `AnimatedCounter` | Vigente | [motion-wrappers.md](./components/motion-wrappers.md) |

---

## Convenciones

- Rutas y archivos en docs deben existir en el repo (verificar con búsqueda antes de enlazar).
- Marcar explícitamente referencias **legacy**.
- Al cambiar anclas (`id` en DOM), actualizar `v2-section-registry.ts` y `api-docs-nav.ts`.
- Al subir assets home, actualizar `brand-media.ts` y [`visuals.md`](./content/visuals.md).

---

## Contribución

1. Cambio de UI → actualizar [landing-architecture.md](./content/landing-architecture.md) si afecta rutas, CTAs o estructura.
2. Cambio de assets → [`visuals.md`](./content/visuals.md) + `public/brand/home/README.md`.
3. Cambio de tokens → [`DESIGN.md`](../DESIGN.md) + `design-system-token-contract.ts`.
