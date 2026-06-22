# Media Kit & Visuals

Recursos visuales para la landing, prensa e inversores. Estética **monocromo** (OpenAI / Anduril) en `apps/landing`.

**Mapa técnico (rutas, Drenyra, API, CTAs):** [landing-architecture.md](./landing-architecture.md).
**Documentación completa de influencias de diseño:** [Design Influences 2026](../../../../docs/design/design-influences-2026.md).

## Home de marca (`/`) — multimedia

La home prioriza **imagen sobre párrafos**. Los archivos van en el filesystem de Next (`public/`) y se referencian desde código.

### Dónde subir archivos (disco)

Raíz del paquete landing:

```text
apps/landing/public/brand/home/
```

Guía rápida en el mismo directorio: [`public/brand/home/README.md`](../../public/brand/home/README.md).

### Rutas públicas (URL)

| URL | Archivo en disco | Sección |
| --- | --- | --- |
| `/brand/home/hero.webp` | `public/brand/home/hero.webp` | Hero |
| `/brand/home/hero.mp4` | `public/brand/home/hero.mp4` | Video hero (opcional, no cableado aún) |
| `/brand/home/drenyra.webp` | `public/brand/home/drenyra.webp` | Showcase Drenyra |
| `/brand/home/ledger.webp` | `public/brand/home/ledger.webp` | Showcase Ledger |
| `/brand/home/cortex.webp` | `public/brand/home/cortex.webp` | Showcase Cortex |
| `/brand/home/ecosystem/studio.webp` | `public/brand/home/ecosystem/studio.webp` | Tile ecosistema |
| `/brand/home/ecosystem/sire.webp` | `public/brand/home/ecosystem/sire.webp` | Tile ecosistema |
| `/brand/home/ecosystem/seguridad.webp` | `public/brand/home/ecosystem/seguridad.webp` | Tile ecosistema |
| `/brand/home/ecosystem/api.webp` | `public/brand/home/ecosystem/api.webp` | Tile ecosistema |
| `/brand/home/ecosystem/gov.webp` | `public/brand/home/ecosystem/gov.webp` | Tile Gov (roadmap) |
| `/brand/home/ecosystem/grid.webp` | `public/brand/home/ecosystem/grid.webp` | Tile Grid (roadmap) |

### Registro en código

| Archivo | Rol |
| --- | --- |
| `lib/landing/brand-media.ts` | Constantes `src` + `alt` (fuente de verdad de rutas) |
| `components/landing/brand/brand-media-slot.tsx` | Slot vacío (`#0a0a0a`) hasta que la imagen cargue |
| `components/landing/brand/brand-surface-scene.tsx` | Hero + productos |
| `components/landing/brand/brand-ecosystem-grid.tsx` | Tiles ecosistema |

Si cambiás nombre o formato de archivo, actualizá **`brand-media.ts`** y esta tabla.

### Especificaciones recomendadas

| Tipo | Dimensiones | Formato | Notas |
| --- | --- | --- | --- |
| Hero / productos | ≥ 1920×1080 (16:9) | WebP | Full-bleed, `object-cover` |
| Ecosistema | ≥ 800×600 | WebP | Tiles en grid 1×2×4 |
| Hero video | 1920×1080, H.264 | MP4 | Constante `BRAND_HOME_HERO_VIDEO`; integración UI pendiente |

Hasta que existan los archivos, la UI muestra **fondo neutro sin mock** (sin placeholders de UI inventados).

## Drenyra (`/drenyra`) — previews en código

La página Drenyra **no** usa `public/brand/home/` para el hero. Los mocks viven en componentes:

| Componente | Archivo |
| --- | --- |
| Hero tabs (workspace / terminal) | `components/drenyra/drenyra-hero-media.tsx` |
| Terminal mock | `components/drenyra/drenyra-terminal-preview.tsx` |
| Workspace mock | `components/drenyra/drenyra-workspace-preview.tsx` |

Copy: `lib/landing/copy/v2/drenyra-engine.ts`.

## WhatsApp (contacto comercial)

| Elemento | Valor |
| --- | --- |
| Número canónico | `+51 926 437 404` (`51926437404` en `lib/seo/config.ts`) |
| Enlace | `lib/whatsapp.ts` → `https://wa.me/51926437404?…` |
| CTA flotante | `components/ui/whatsapp-cta.tsx` (solo rutas de conversión) |

No usar `51999999999` en Vercel env; el código ignora placeholders.

## Marca (SVG / favicon)

| Elemento | Ruta |
| --- | --- |
| Mark | `public/brand/mark.svg` |
| Logo / icon / favicon | `public/brand/logo.svg`, `icon.svg`, `favicon.svg` |

Ver también `DESIGN.md` → Brand assets.

## OG / social

Imagen Open Graph generada dinámicamente: `app/api/og/route.tsx` (no usa `public/brand/home/`).

## Identidad (referencia)

| Elemento | Especificación |
| --- | --- |
| **Canvas** | `#0A0A0A` |
| **Copy** | `#FAFAFA` |
| **Bordes** | `landing-border` / `foreground/10` |

---

Para solicitudes de media de alta resolución fuera del repo: [press@arkelythexfounders.com](mailto:press@arkelythexfounders.com).
