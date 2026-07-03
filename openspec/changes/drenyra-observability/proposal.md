# SDD Proposal: Observability & Operations — Backend Production Readiness

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** B3 de 4 (Backend)
**Dependencia del frontend:** BAJA — el frontend no necesita observabilidad directamente, pero sí necesita saber cuándo el backend falla

---

## Executive Summary

Implementar logging estructurado, global error handler, health checks completos, y métricas de operación para que el backend de Drenyra sea observable en producción. Cuando algo falle — y va a fallar — necesitamos saber QUÉ, DÓNDE, y PARA QUIÉN sin tener que leer logs planos.

**Target:** "Cada request deja un rastro. Cada error tiene contexto. Cada health check prueba una dependencia real."

---

## Problem

1. **Sin global error handler** — Elysia no tiene un `onError` global. Cada feature maneja errores a su manera. Errores no capturados devuelven HTML plano de Bun/Elysia.
2. **Sin logging estructurado en features nuevas** — Pino está en package.json pero no se usa sistemáticamente. Los features nuevos usan `console.log` o `getErrorMessage` sin contexto.
3. **Health checks incompletos** — El módulo health existe pero no cubre dependencias como DB, AI gateway, SUNAT, o evidencia de que el sistema puede operar.
4. **Sin métricas de operación** — No hay contadores de requests, latencia, errores por endpoint, o throughput. No hay dashboard de operaciones.
5. **Sin correlación de errores** — No hay `requestId` en respuestas de error para tracing. No se puede correlacionar un error en frontend con su causa en backend.
6. **Sin structured error response** — Los errores no siguen un schema consistente que el frontend pueda parsear.

---

## Solution

### 1. Global Error Handler (Elysia onError)

```typescript
// apps/api/src/shared/error-handler.ts
app.onError(({ code, error, set, request }) => {
  const requestId = crypto.randomUUID()
  const path = new URL(request.url).pathname

  logger.error({
    requestId,
    code,
    path,
    error: error.message,
    stack: error.stack,
  })

  set.status = code === 'NOT_FOUND' ? 404 : code === 'VALIDATION' ? 400 : 500

  return {
    success: false,
    error: {
      code: mapElysiaCode(code),
      message: error.message,
      requestId,
    },
  }
})
```

### 2. Structured Logging Pipeline

```typescript
// apps/api/src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
})
```

Cada feature inyecta contexto:

```typescript
logger.info({
  feature: 'accounting-prs',
  companyId,
  action: 'approve',
  prId: params.id,
  duration: Date.now() - start,
})
```

### 3. Health Check Expansion

```typescript
// apps/api/src/features/health/application/queries/
GET /health          ← Básico: { status: "ok" }
GET /health/ready    ← Ready: DB, AI gateway, cola de workers
GET /health/live     ← Liveness: proceso vivo
GET /health/deps     ← Dependencias: SUNAT, AI, S3, etc.
```

Health checks actuales a expandir:

- `check-ready.ts` → agregar verificación de conexión DB
- `check-doctor.ts` → ya existe, verificar cobertura
- `rls-readiness.ts` → ya existe, mantener

### 4. Request Metrics

```typescript
// apps/api/src/shared/metrics.ts
export const metrics = {
  requestCount: new Map<string, number>(),
  errorCount: new Map<string, number>(),
  latencyBuckets: new Map<string, number[]>(),

  record(feature: string, status: number, duration: number) {
    const key = `${feature}:${status}`
    this.requestCount.set(key, (this.requestCount.get(key) ?? 0) + 1)
    if (status >= 400) {
      this.errorCount.set(key, (this.errorCount.get(key) ?? 0) + 1)
    }
  },
}

// Exponer via GET /api/metrics
app.get('/api/metrics', () => ({
  requests: Object.fromEntries(metrics.requestCount),
  errors: Object.fromEntries(metrics.errorCount),
}))
```

### 5. Performance Monitoring

Agregar middleware que mide latencia por feature:

```typescript
// apps/api/src/shared/plugins/request-timing.ts
app.onBeforeHandle(({ request }) => {
  request.startTime = performance.now()
})

app.onAfterHandle(({ request, set }) => {
  const duration = performance.now() - (request as any).startTime
  const path = new URL(request.url).pathname
  if (duration > 1000) {
    logger.warn({ path, duration, status: set.status }, 'Slow request detected')
  }
})
```

---

## Architecture

```text
apps/api/src/
├── lib/
│   └── logger.ts                    ← Pino instance
├── shared/
│   ├── error-handler.ts             ← Global onError handler
│   ├── metrics.ts                   ← Request metrics collector
│   └── plugins/
│       └── request-timing.ts        ← Latency measurement
│
└── features/
    └── health/
        └── application/queries/
            ├── check-ready.ts       ← DB + AI gateway
            ├── check-live.ts        ← Process alive
            └── check-deps.ts        ← External dependencies
```

---

## Dependencies

| Plan                      | Dependencia                                                 |
| ------------------------- | ----------------------------------------------------------- |
| Plan B1 (API Contracts)   | El response envelope unificado incluye `requestId` en error |
| Plan B2 (Data Integrity)  | Independiente                                               |
| Plan B4 (Security/Deploy) | El error handler debe funcionar con rate limiting           |

---

## Delivery

**Estrategia:** auto-chain — 3 PRs encadenados

| PR  | Scope                                           | Archivos | Líneas |
| --- | ----------------------------------------------- | -------- | ------ |
| PR1 | Global error handler + structured logger + Pino | 4-6      | ~200   |
| PR2 | Health check expansion + metrics collector      | 6-8      | ~250   |
| PR3 | Request timing middleware + slow-request alerts | 4-6      | ~150   |

**Total estimado:** ~600 líneas · 14-20 archivos · 3 PRs

---

## Risks

- El global onError handler puede tragar errores que antes llegaban al cliente — asegurar que errores de negocio (400, 404, 422) se distingan de errores de sistema (500).
- Pino en producción necesita configuración de destino (stdout, file, transport externo como Datadog/Axiom).
- Health checks que prueban dependencias reales (SUNAT, AI) pueden fallar por latencia de red — usar timeouts agresivos (2s máx) y cachear resultados por 30s.
- Las métricas en memoria no persisten entre reinicios. Para producción real se necesita Prometheus o similar — pero para el MVP alcanza.

---

## Non-goals

- No se implementa Prometheus/Grafana
- No se agrega APM tracing distribuido (OpenTelemetry)
- No se implementa agregación de logs (Datadog, Axiom, etc.)
- No se toca la lógica de negocio
- No se agregan dashboards de operaciones (solo endpoints de métricas)
