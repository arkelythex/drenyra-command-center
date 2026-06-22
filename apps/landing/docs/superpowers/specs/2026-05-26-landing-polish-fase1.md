# Landing Fase 1: Limpieza Estructural + Brand + Skeleton + A11y

**Date:** 2026-05-26
**Status:** Approved for implementation
**Audience:** User requested "haz lo que sea necesario para ser 10/10" after review rated landing 7.5/10.

---

## Goal

Elevar el landing de Arkelythex de 7.5 → 10/10 en estructura, arquitectura, lógica y experiencia de usuario mediante cuatro intervenciones no invasivas.

---

## Changes

### 1.1 Refactor naming `v2/` → canonical paths

**Problem:** `lib/landing/copy/v2/`, `v2-section-ids.ts`, `v2-section-registry.ts` contienen un prefijo `v2` que sugiere un rewrite histórico ya consolidado. Es ruido cognitivo.

**Solution:** Mover todo a paths canónicos sin prefijo v2.

| Before | After |
|---|---|
| `lib/landing/copy/v2/` | `lib/landing/copy/` (mover contenido, mantener estructura) |
| `lib/landing/copy/v2/index.ts` → `copy/index.ts` |
| `lib/landing/v2-section-ids.ts` | `lib/landing/section-ids.ts` |
| `lib/landing/v2-section-registry.ts` | `lib/landing/section-registry.ts` |
| `lib/landing/v2-section-registry.test.ts` | `lib/landing/section-registry.test.ts` |

**Export changes:**
- `V2_LANDING_COPY` → keep as alias, add `LANDING_COPY` canonical export
- `V2_SHELL_SECTION_ORDER` → `SHELL_SECTION_ORDER` (alias for compat)
- `V2_BODY_SECTION_ORDER` → `BODY_SECTION_ORDER` (alias for compat)
- `V2_NAVBAR_LINKS` → `NAVBAR_LINKS` (alias for compat)
- All component/page imports updated

**Risk:** 0 — puramente mecánico. 29 imports actualizados, verify con typecheck.

### 1.2 Brand Color System

**Problem:** El sistema de color es monochrome puro. No hay color de marca. Los estatus (success, warning, danger, info) son todos grises sin significado semántico real.

**Solution:** Agregar tokens de color en `globals.css` que mantengan la estética dark minimalista pero agreguen acentos estratégicos:

**Filosofía:** La marca es oscura y seria (plataforma de inteligencia fiscal). El color no es decorativo — es **funcional**:
- Para **acción** (CTAs, links, hover states)
- Para **estado** (success/danger/warning con color real)
- Para **identidad de producto** (ya existe por producto scoping)

**Nuevos tokens:**

```css
/* Warm copper — acento primario (confianza, solidez, artesanía) */
--brand-copper: #C97F4A;
--brand-copper-soft: rgba(201, 127, 74, 0.15);
--brand-copper-glow: rgba(201, 127, 74, 0.3);

/* Semánticos reales (reemplazan grises que no significan nada) */
--success: #22C55E;       /* verde real */
--success-soft: rgba(34, 197, 94, 0.12);
--info: #3B82F6;          /* azul real */
--info-soft: rgba(59, 130, 246, 0.12);
--warning: #F59E0B;       /* amber real */
--warning-soft: rgba(245, 158, 11, 0.12);
--danger: #EF4444;        /* rojo real */
--danger-soft: rgba(239, 68, 68, 0.12);
```

**Uso del cobre:**
- `--color-accent` → copper en vez de gris (CTA buttons, hover states)
- `--color-primary` → se mantiene blanco (títulos, texto principal)
- `focus-visible ring` → copper glow en vez de gris
- Badges/tags → copper soft background
- Scrollbar accent → copper

**No cambiar:** Backgrounds (negro puro), surfaces (gris oscuro), texto (blanco/gris). La esencia monochrome se mantiene.

### 1.3 Skeleton Loaders

**Problem:** `loading.tsx` tiene un spinner genérico con texto "Preparando tu experiencia fiscal..." — informativo pero no da contexto visual de lo que está cargando.

**Solution:** Crear componentes de skeleton que reflejen la estructura de la página:

- **`<Skeleton>`** — componente base con `animate-pulse` + border radius configurable
- **Skeleton composición** — para la landing, el hero skeleton es: título grande + subtítulo + CTAs
- **Páginas hijas** (drenyra, ledger, etc.) — skeleton más específico: sidebar + content blocks
- **Páginas de documentación** — skeleton con estructura de docs

**Cómo funciona:**
- Se mantiene el `loading.tsx` del App Router que Next.js muestra automáticamente
- Los skeletons usan `bg-surface-hover` (el mismo gris de los hover states)
- `animate-pulse` nativo de Tailwind (ya existe en el proyecto)
- Todos los skeletons son accesibles: `role="status"`, `aria-busy="true"`

### 1.4 Accesibilidad — Auditoría y Fixes

**Problem:** El landing ya es bastante accesible, pero hay puntos finos que revisar.

**Auditoría scope:**
1. **Contraste en glass/blur** — elementos con `backdrop-blur-xl` + fondos semi-transparentes pueden perder contraste en texto pequeño
2. **Keyboard navigation** — verificar que todos los interactive elements sean focusables
3. **ARIA labels** — botones icon-only (like menu toggle, social links) deben tener label
4. **Focus indicators** — `focus-visible:ring` presente en todos los interactive elements
5. **Touch targets** — mínimo 44×44px en mobile (CTA mobile, close buttons)
6. **Heading hierarchy** — `<h1>` → `<h2>` → `<h3>` sin saltos

**Expected fixes:** 3-8 issues found, each with specific fix.

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **v2 refactor solo renombra, no reestructura** | Mover archivos, no cambiar lógica interna. Mínimo diff. |
| **Alias backward compat** | `V2_LANDING_COPY` → `LANDING_COPY` pero el alias viejo se exporta también para evitar imports rotos en worktrees/branches |
| **Copper como acento** | Conecta con el branding existente de Drenyra (cream/copper), es profesional sin ser llamativo, funciona en modo oscuro |
| **Skeleton sin librería externa** | `animate-pulse` de Tailwind alcanza. No agregar dependencia |
| **Cuanto a11y es arreglo directo** | Issues concretos → fixes directos. Sin tooling nuevo |

---

## Files Changed

| File | Change |
|---|---|
| `lib/landing/copy/v2/*` (19 files) | Movidos a `lib/landing/copy/` |
| `lib/landing/v2-section-ids.ts` | Renombrado a `section-ids.ts` |
| `lib/landing/v2-section-registry.ts` | Renombrado a `section-registry.ts` |
| `lib/landing/v2-section-registry.test.ts` | Renombrado a `section-registry.test.ts` |
| 15+ page/component files | Import paths actualizados |
| `app/globals.css` | +15 tokens CSS (copper + semantic colors) |
| `app/loading.tsx` | Reemplazado con skeleton loaders |
| `components/ui/skeleton.tsx` | Nuevo: componente Skeleton base |
| Varios componentes | Acentos de color aplicados (CTAs, hover, focus) |
| `lib/landing/copy/index.ts` | Export actualizado con alias compat |

---

## Verification

```bash
cd apps/landing
bun run typecheck
bun run test
bun run build
```
