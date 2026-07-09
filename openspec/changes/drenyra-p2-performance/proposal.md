# P2: Performance & Optimization

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**PRs estimados:** 3
**Líneas estimadas:** ~800
**Depende de:** Nada (paralelo con F1-F6)

---

## Problema

Drenyra no tiene:

- Benchmarks de performance (ni baseline, ni regressions)
- Bundle analysis (la web SPA creció sin control)
- Query optimization (N+1 queries en endpoints fiscales)
- Cold start measurement (Bun + Elysia en serverless)
- Caching strategy (qué se puede cachear y qué no)

Sin métricas, no hay optimización. Sin optimización, la experiencia se degrada.

## Diagnóstico Inicial

### Sospechas (por confirmar con mediciones)

| Área             | Sospecha                                     | Impacto                                 |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| Web bundle       | >500KB JS sin code-splitting                 | Cold start lento en SPA                 |
| API queries      | N+1 en listados de facturas con detracciones | Respuesta >2s en empresas con >500 docs |
| API cold start   | Bun en serverless sin keep-alive             | 500ms+ en primer request                |
| Images/Bundle    | SVGs sin optimizar, icons inline             | Bundle crece                            |
| State management | Re-renders excesivos en dashboard            | UI lag en firefox/edge                  |

## Cambios Propuestos

### PR 1: Baseline Benchmarks + Bundle Analysis (250 líneas)

**Qué:** Medir antes de optimizar. Crear scripts de benchmark.

**Archivos nuevos:**

- `scripts/perf/bundle-report.ts` — analysis con `vite-bundle-visualizer` y `source-map-explorer`
- `scripts/perf/api-benchmark.ts` — artillery/k6 para endpoints críticos
- `scripts/perf/dashboard-benchmark.ts` — Lighthouse CI thresholds

**Métricas baseline:**

- Web: bundle size por ruta, Lighthouse score, FCP, LCP, TTI
- API: p50/p95/p99 response time por endpoint
- DB: query plans lentos (EXPLAIN ANALYZE)

### PR 2: Query Optimization (300 líneas)

**Qué:** Atacar N+1 queries.

- Revisar endpoints con múltiples queries por item:
  - `GET /invoices?companyId=X` → N queries a detracciones
  - `GET /bills?companyId=X` → N queries a retenciones
  - `GET /cashflow/projection` → queries anidadas
- Implementar batch loading donde sea posible
- Agregar índices compuestos en columnas fiscales frecuentes (companyId + period, ruc + status)
- Migrar queries lentas a JOINs en lugar de N+1 en el código

### PR 3: Caching + Cold Start (250 líneas)

**Qué:** Cachear lo que se puede, optimizar lo que no.

- **API cache**: Respuestas de endpoints GET con TanStack Query + staleTime configurable
- **DB cache**: Consultas de tasas fiscales (cambian una vez al año, no por request)
- **CDN headers**: Cache-Control para assets estáticos
- **Cold start**: Lazy loading de módulos pesados (XML/UBL builder, PDF generator)
- **Bundle splitting**: Lazy routes en TanStack Router (cada feature route es un chunk aparte)

## Criterios de Aceptación

1. Bundle reports existen y se pueden regenerar con `bun run perf:bundle`
2. Lighthouse score > 90 en ruta principal
3. Todos los endpoints fiscales tienen p95 < 500ms
4. API cold start < 200ms (vs baseline)
5. 0 N+1 queries en endpoints críticos (verificable con logs)
