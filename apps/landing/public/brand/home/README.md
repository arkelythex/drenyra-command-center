# Brand home — multimedia (`/`)

Colocá aquí las imágenes y el video de la **home de marca**. Next.js las sirve en la URL pública bajo `/brand/home/…`.

## Rutas en disco → URL

| Archivo (relativo a esta carpeta) | URL pública | Uso en la página |
| --- | --- | --- |
| `hero.webp` | `/brand/home/hero.webp` | Hero (`#producto`) |
| `hero.mp4` | `/brand/home/hero.mp4` | Video opcional del hero (futuro) |
| `drenyra.webp` | `/brand/home/drenyra.webp` | Showcase Drenyra |
| `ledger.webp` | `/brand/home/ledger.webp` | Showcase Ledger |
| `cortex.webp` | `/brand/home/cortex.webp` | Showcase Cortex |
| `ecosystem/studio.webp` | `/brand/home/ecosystem/studio.webp` | Tile Studio |
| `ecosystem/sire.webp` | `/brand/home/ecosystem/sire.webp` | Tile SIRE |
| `ecosystem/seguridad.webp` | `/brand/home/ecosystem/seguridad.webp` | Tile Seguridad |
| `ecosystem/api.webp` | `/brand/home/ecosystem/api.webp` | Tile API Docs |
| `ecosystem/gov.webp` | `/brand/home/ecosystem/gov.webp` | Tile Gov (roadmap) |
| `ecosystem/grid.webp` | `/brand/home/ecosystem/grid.webp` | Tile Grid (roadmap) |

## Convenciones

- **Formato recomendado:** WebP (fallback JPG/PNG aceptable si actualizás `lib/landing/brand-media.ts`).
- **Hero / productos:** orientación horizontal, mín. **1920×1080** (o 16:9 equivalente).
- **Ecosistema:** mín. **800×600** por tile; se recortan con `object-cover`.
- **Peso:** optimizar antes de commit (< 400 KB por still si es posible).
- **Alt text:** definido en código → `lib/landing/brand-media.ts` (no en el nombre del archivo).

## Registro en código

Las rutas canónicas viven en:

- `lib/landing/brand-media.ts` — constantes `BRAND_HOME_SURFACE_MEDIA` y `BRAND_HOME_ECOSYSTEM_MEDIA`
- `components/landing/brand/brand-media-slot.tsx` — slot vacío hasta que el archivo exista

Documentación extendida:

- `docs/content/visuals.md` — especificaciones y tablas
- `docs/content/landing-architecture.md` — cómo encaja la home en la app

## Carpetas

```text
public/brand/home/
├── hero.webp
├── hero.mp4          # opcional
├── drenyra.webp
├── ledger.webp
├── cortex.webp
└── ecosystem/
    ├── studio.webp
    ├── sire.webp
    ├── seguridad.webp
    ├── api.webp
    ├── gov.webp
    └── grid.webp
```

Hasta subir archivos, la UI muestra fondo neutro (`#0a0a0a`) sin mock de UI.
