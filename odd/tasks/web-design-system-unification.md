# Unificar el sistema de diseño de `apps/web`

**Última actualización**: 2026-10-19

## Objective
Un solo sistema de diseño, con una sola fuente de valores, sin componentes duplicados ni código legacy, siguiendo `apps/web/DESIGN.md` (v3 «Fiscal Editorial») como canon. Desbloquea login/registro, que hoy revientan por tokens inexistentes.

## Hallazgos (medidos 2026-10-19)
**Capas de tokens que se pisan** (orden de carga en `src/index.css`):
1. `lib/design-tokens/generated/tokens.css`: stub «minimal» azul, ajeno a la marca.
2. `styles/design-system.css`: «Ledger OS» (Light Pearl + OLED), ~340 líneas.
3. `index.css` (2084 líneas): Fiscal Editorial, acentos, densidad, z-index.
4. `design-system/DESIGN.md` es un *Placeholder*; el canon real está en `apps/web/DESIGN.md`.

**Dos APIs de tema incompatibles:** `stores/ui.store.ts` (`accentPreset`, `density`) frente a `lib/ux-mode.ts` + `UXModeToggle` (`accentPreference`, `themePreference`, paquete custom). El toggle lee campos que el store no tiene.

**Componentes sin ningún importador** (verificado con grep en `apps`, `packages`, `e2e`): `glass-card`, `liquid-glass`, `metric-card`, `page-transition`, `typography`, `keyboard-shortcuts-help`, `data-state-wrapper`, `floating-action-button` (+ carpeta). Familia de superficies duplicada: `card`, `SurfaceCard`, `SurfacePanel`, `panel`.

**Módulos importados que no existen** (nunca estuvieron en git): `@/hooks/useHaptics`, `@/components/layout/MobileTabNavigation`.

## Principios
- CSS es la única fuente de valores; TypeScript solo nombra (`var(--z-modal)`), salvo física de movimiento (números).
- Una sola API de tema; el store es el dueño del estado y `design-tokens/theme-package` solo aplica al DOM.
- Una sola familia de superficies (`SurfaceCard`/`SurfacePanel`); `card.tsx` queda como primitivo shadcn si algo lo necesita.
- Borrar lo que no tiene importadores; nada de «por si acaso».

## Fases (un PR cada una)
- [x] **1. Módulo de tokens real:** `design-tokens.ts` (Z_INDEX, BORDER_RADIUS, MOTION_VARIANTS, `useDesignTokens`, `tokensToClasses`) + `design-tokens/theme-package(.schema).ts`. 12 tests nuevos. Efecto medido: `vitest` web 18→13 archivos fallidos, login/registro/UserMenu/InvoicesSummaryBoard vuelven a pasar; ratchet web 432→412.
- [x] **2. Borrar componentes UI sin importadores** (lista arriba, más `layout/command-deck`). Build y tests sin cambios; ratchet web 412→395.
- [x] **3. Una sola API de tema:** `ui.store` reescrito al modelo de `ux-mode` (`themePreference`/`accentPreference`/`densityPreference`), con los tipos del esquema y la misma clave de persistencia; se eliminó el modelo viejo (`theme`, `accentPreset`, `density`, `complexityLevel`, sidebar duplicado, sin consumidores). Hallazgo: **el tema nunca se aplicaba al arrancar**; `client.tsx` ahora llama `applyPersistedTheme()`. 4 tests nuevos.
- [ ] **4. Colapsar capas CSS:** fusionar `tokens.css` y `design-system.css` en `index.css` (o separar `index.css` en archivos por responsabilidad), eliminando valores repetidos.
- [ ] **5. Unificar superficies:** migrar usos de `card` a `SurfaceCard`/`SurfacePanel` o al revés (22 vs 13 importadores; decidir con el diseño).
- [x] **6. Módulos fantasma:** `hooks/useHaptics` (respeta `prefers-reduced-motion`, sin excepciones) y `components/layout/MobileTabNavigation` escritos con tests. Tablero de facturas, tarjeta y controlador vuelven a cargar; ratchet web 395→386.
- [x] **6b.** `@/stores/sidebar-layout.store` (fantasma) sustituido por `useAgenticShell.setSidebarMobileOpen` en ComplianceView, LedgerView y ReconciliationView.
- [ ] **7. `design-system/DESIGN.md`:** reemplazar el placeholder por un enlace al canon (una sola copia).

## Fuera de alcance
Cambiar la paleta o la marca; tocar lógica fiscal.
