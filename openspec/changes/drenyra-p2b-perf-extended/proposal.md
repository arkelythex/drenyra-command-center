# P2b: Extended Performance Optimization

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 3
**Líneas estimadas:** ~800
**Depende de:** P2 (Performance & Optimization baseline)
**Tags:** performance, bundle, react, rendering, profiling

---

## Problema

P2 cubre benchmarks, N+1 queries, y caching. Pero hay áreas de performance que no entran en P2:

- **React rendering excesivo**: re-renders en el dashboard fiscal, sidebar, thread list (1932 archivos en web, 80 tests — baja cobertura de performance)
- **Bundle code-splitting**: cada feature route carga TODO el bundle, no hay lazy loading granular
- **Image/assets optimization**: SVGs inline sin optimizar, icons en bundle que no se cachean
- **Memory leaks**: listeners, subscriptions, timers sin cleanup en componentes
- **Web vitals**: FCP, LCP, TTI sin monitoreo ni targets
- **TanStack Router lazy routes**: las rutas no están code-split por feature

## Cambios Propuestos

### PR 1: React Rendering Optimization (300 líneas)

**Qué:** Reducir re-renders y optimizar el árbol de componentes.

**Acciones:**

1. **React Profiler audit**: Identificar componentes que re-renderizan sin necesidad
   - `rg "useState|useEffect" apps/web/src/features/` — candidatos a memoización
   - Componentes con props que cambian frecuentemente
2. **Optimizaciones**:
   - Extraer componentes puros con `React.memo` (aunque React 19 compiler ayuda, no reemplaza la estructura)
   - Mover state down: estados que están en el padre pero solo los usa un hijo
   - Eliminar `useEffect` para derivación de datos → usar TanStack Query `select`
   - Implementar `useDeferredValue` para búsqueda en sidebar/threads
3. **Dashboard performance**:
   - Virtual scrolling en listas de consultas/threads (más de 100 items)
   - Debounced search input en sidebar

### PR 2: Bundle Code-Splitting (300 líneas)

**Qué:** Dividir el bundle SPA en chunks por ruta feature.

**Acciones:**

1. **TanStack Router lazy routes**: Todas las rutas de features deben ser lazy:

   ```typescript
   // ANTES
   import { DashboardPage } from './features/dashboard'

   // DESPUÉS
   const DashboardPage = React.lazy(() => import('./features/dashboard'))
   ```

2. **Library splitting**: Separar librerías pesadas en chunks aparte:
   - `pdf-lib`, `exceljs` → load on demand (solo cuando se exporta)
   - `echarts`/chart libs → chunk separado
3. **vite-bundle-visualizer**: Correr y establecer targets por chunk

**Bundle targets:**

| Chunk        | Target  | Notas                        |
| ------------ | ------- | ---------------------------- |
| Main entry   | < 150KB | React, Router, core UI       |
| Dashboard    | < 50KB  | Charts, fiscal widgets       |
| Chat/Thread  | < 50KB  | Chat UI, message components  |
| Settings     | < 30KB  | Config screens               |
| Skills/Auto  | < 30KB  | Skills registry, automations |
| Export/Print | < 100KB | PDF, Excel (lazy)            |

### PR 3: Memory Leak Fix + Web Vitals (200 líneas)

**Qué:** Eliminar memory leaks y establecer monitoreo de Web Vitals.

**Acciones:**

1. **Leak audit**:
   - `useEffect` con subscriptions sin cleanup: `rg "useEffect.*addEventListener|useEffect.*subscribe|useEffect.*setInterval" apps/web/`
   - Timers sin clear: `setInterval`/`setTimeout` sin `clearInterval`/`clearTimeout`
   - Event listeners en window/document sin cleanup
2. **Web Vitals**:
   - Agregar `web-vitals` library para monitoreo en dev/prod
   - Targets: FCP < 1.5s, LCP < 2.5s, TTI < 3.5s
   - Logging de Web Vitals en ambiente de dev para tracking
3. **CSS containment**: Agregar `content-visibility: auto` en secciones fuera de viewport (sidebar secondary, footer)

## Criterios de Aceptación

1. Lighthouse score > 90 en ruta principal (vs baseline de PR 1 en P2)
2. Bundle main entry < 150KB (gzip)
3. Dashboard re-renders reducidos en 40%+ (verificable con React DevTools Profiler)
4. 0 memory leaks en componentes montados/desmontados (verificable con Heap snapshot diff)
5. Lazy routes implementadas para todas las rutas feature
6. `bun run test` pasa sin regresiones
7. `bun run typecheck` pasa
