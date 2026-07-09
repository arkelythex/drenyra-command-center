# C1: CSS Modernization — Tailwind 4 & Design Token Alignment

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~500
**Depende de:** DS1 (Design Token Foundation), DS2 (Typography)
**Tags:** css, tailwind, design-system, styles, modernization

---

## Problema

Drenyra tiene un design system "Glass & Steel" con tokens CSS. Investigación web de julio 2026:

- **Tailwind version**: Drenyra usa `^4.1.18`. La latest es **v4.3** (Mayo 2026). Migración de v4.1 → v4.3 es menor, pero hay que verificar compatibilidad de tokens con las nuevas features de v4.3.
- **CSS layers**: no se usan `@layer` para controlar especificidad y orden de estilos
- **Token duplication**: tokens CSS definidos en `design-system/` y también hardcodeados en componentes
- **Dark mode**: implementado ad-hoc en vez de usar `@media prefers-color-scheme` + Tailwind dark variants
- **CSS bundle**: estilos no utilizados que no se purgan correctamente
- **`var()` in className**: uso de `var(--token)` en clases de Tailwind en vez de usar las utility classes nativas del design system (Tailwind 4 lo resuelve con theme variables)

## Cambios Propuestos

### PR 1: Tailwind CSS v4.1 → v4.3 Upgrade (300 líneas)

**Qué:** Drenyra ya usa Tailwind v4 (^4.1.18). Upgrade a v4.3 (Mayo 2026).

**Acciones:**

1. **Actualizar package**: `bun add tailwindcss@^4.3 -E`
2. **Verificar que la config CSS-first** ya esté implementada (Drenyra no tiene `tailwind.config.js` porque v4 usa CSS-first)
3. **Revisar changelog de v4.2 y v4.3** para cambios en utility classes
4. **Correr `@tailwindcss/upgrade`** para migración automática parcial

   ```css
   /* apps/web/src/styles/tokens.css */
   @import 'tailwindcss';

   @theme {
     --color-brand-50: oklch(0.95 0.02 240);
     --color-brand-100: oklch(0.9 0.04 240);
     /* ... resto de tokens del design system */

     --font-sans: 'Inter', 'Geist', system-ui, sans-serif;
     --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
   }
   ```

5. **Verificar el PostCSS plugin**: Tailwind v4 usa `@tailwindcss/postcss` en vez del plugin legacy
6. **Correr tests visuales** (Playwright screenshots) para detectar regresiones

**Herramientas:**

- `@tailwindcss/upgrade` — migración automática
- Playwright screenshot diff para regresiones visuales

### PR 2: CSS Architecture Cleanup (200 líneas)

**Qué:** Organizar los estilos con CSS layers y eliminar duplicación.

**Acciones:**

1. **Implementar CSS layers**:

   ```css
   @layer tokens, base, components, utilities, overrides;
   ```

2. **Mover tokens** del `design-system/` a `packages/ui/src/styles/tokens.css`
3. **Eliminar CSS muerto**: Correr `purgecss` para detectar clases no usadas
4. **Unificar dark mode**: Usar `@variant dark` (Tailwind v4) en vez de clases manuales
5. **Documentar CSS architecture** en `packages/ui/README.md`

**Archivos canónicos de CSS:**

| Archivo                                 | Propósito                                  |
| --------------------------------------- | ------------------------------------------ |
| `packages/ui/src/styles/tokens.css`     | Tokens del design system + Tailwind @theme |
| `packages/ui/src/styles/base.css`       | CSS reset, typography base, layers         |
| `packages/ui/src/styles/components.css` | Component-level global styles              |
| `apps/web/src/styles/app.css`           | App-specific overrides                     |

## Criterios de Aceptación

1. Tailwind v4 configurado sin `tailwind.config.js` (CSS-first config)
2. `@layer` implementado para tokens, base, components, utilities
3. 0 clases de Tailwind con `var()` inline (todas via `@theme`)
4. Dark mode funciona sin estilos hardcodeados
5. CSS bundle < 50KB (gzip) después de purge
6. `bun run build` pasa sin errores
7. No regresiones visuales en E2E screenshots
