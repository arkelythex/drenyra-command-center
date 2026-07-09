# D1: Dependency Modernization — Spec

**Fecha:** 2026-07-09
**Basado en:** Investigación web de julio 2026, dependency audit, code analysis

---

## Visión General

Migrar Drenyra de su estado actual de dependencias a un estado actualizado y consolidado, priorizando seguridad y estabilidad fiscal sobre la última versión.

## Principios (Gentleman Philosophy)

1. **Seguridad fiscal primero**: Ninguna migración puede romper cálculos de IGV, detracciones, o validación RUC
2. **Testing primero**: Cada migración requiere tests que verifiquen los invariantes fiscales antes de aplicarla
3. **Incremental**: Una dependencia a la vez, no todo junto
4. **Reversible**: Cada cambio debe poder revertirse individualmente

## Orden de Migración (Risk-Ordered)

### Fase 1: Safe Updates (listo ✅)

| Dep         | De     | A      | Riesgo  | Estado             |
| ----------- | ------ | ------ | ------- | ------------------ |
| turbo       | 2.9.18 | 2.10.4 | ✅ Bajo | Done               |
| better-auth | 1.6.19 | 1.6.23 | ✅ Bajo | Done               |
| eslint      | 10.5.0 | 10.6.0 | ✅ Bajo | Done               |
| biome       | 2.5.0  | 2.5.3  | ✅ Bajo | Blocked by Bun age |

### Fase 2: AI SDK v6→v7 (Siguiente)

**Por qué ahora:** Anunciado 25 Jun 2026. Drenyra usa `ai: ^6.0.x` con dual versioning (6.0.39 en api, 6.0.206 en packages/ai). La migración desbloquea nuevas capacidades de agentes.

**Riesgo:** MEDIO. Breaking changes en API de streaming, tool calling. No afecta lógica fiscal directamente.

**Archivos afectados:**

- `packages/ai/src/ai/streaming/agent-ui-stream.ts` (LanguageModel, ToolLoopAgent)
- `packages/ai/src/ai/agents/tool-loop-agent.ts` (ToolLoopAgent, stepCountIs)
- `packages/ai/src/ai/tools/index.ts` (tool)
- `apps/api/src/features/ai-swarm/orchestrator/orchestrator.service.ts` (generateText)
- `apps/api/src/features/ai-swarm/agents/*.ts` (3+ agent files usando generateObject)
- `apps/api/package.json` (ai: ^6.0.39)
- `packages/ai/package.json` (ai: ^6.0.206)

**Pasos:**

1. Leer [AI SDK v6→v7 migration guide](https://sdk.vercel.ai/docs)
2. Unificar version: `ai: ^7.0.19` en ambos package.json
3. Actualizar `@ai-sdk/google` de `^3.0.83` a `^4.0.11`
4. Verificar Node.js 22+ requirement (Bun 1.3.14 es compatible)
5. Verificar ESM-only imports
6. Migrar `ToolLoopAgent` → nueva API
7. Migrar `generateText`/`generateObject` → nueva firma
8. Correr tests de AI packages
9. Correr tests de API features que usan AI

### Fase 3: Drizzle 1.0 RC (Pendiente 1.0 stable)

**Por qué esperar:** 1.0.0-rc.4 es release candidate, no stable. Para un sistema fiscal, esperar 1.0 estable.

**Preparación ahora:**

- [x] Audit: 20+ usos de `db.query.X.findFirst/findMany` identificados
- [x] Migration path conocido: [RQBv1→v2 guide](https://orm.drizzle.team/docs/relations-v1-v2)
- [ ] Tarea: Migrar RQBv1 a RQBv2 SIN actualizar drizzle (código compatible con 0.45 y 1.0)

**Archivos afectados (20+):**

- `packages/persistence/src/repositories/postgres-account.repository.ts` (5 usos)
- `packages/persistence/src/repositories/postgres-bank-reconciliation.repository.ts` (3 usos)
- `packages/persistence/src/repositories/postgres-journal-entry.repository.ts` (3 usos)
- `packages/persistence/src/repositories/postgres-bank-transaction.repository.ts` (5+ usos)
- `packages/persistence/src/repositories/postgres-bank-account.repository.ts` (3 usos)
- `packages/persistence/src/PostgresReportDataSource.ts` (1 uso)

### Fase 4: TypeScript 6→7 (Alto riesgo, último)

**Riesgo:** ALTO. Puede romper tipos en todo el codebase. Requiere migration guide de TS 7.

**Pre-requisito:** Todas las fases anteriores completadas y tests pasando.

## Archivos a modificar

```
# AI SDK v7 migration
packages/ai/package.json              # ai: ^7.0.19, @ai-sdk/google: ^4.0.11
apps/api/package.json                  # ai: ^7.0.19 (unificar con packages/ai)
packages/ai/src/ai/streaming/agent-ui-stream.ts
packages/ai/src/ai/agents/tool-loop-agent.ts
packages/ai/src/ai/tools/index.ts
apps/api/src/features/ai-swarm/orchestrator/orchestrator.service.ts
apps/api/src/features/ai-swarm/agents/ocr.agent.ts
apps/api/src/features/ai-swarm/agents/pcge.agent.ts
apps/api/src/features/ai-swarm/agents/sunat.agent.ts
apps/api/src/features/ai-swarm/agents/reconciliation.agent.ts

# Drizzle RQBv1→v2 (preparación, sin actualizar drizzle)
packages/persistence/src/repositories/postgres-account.repository.ts
packages/persistence/src/repositories/postgres-bank-reconciliation.repository.ts
packages/persistence/src/repositories/postgres-journal-entry.repository.ts
packages/persistence/src/repositories/postgres-bank-transaction.repository.ts
packages/persistence/src/repositories/postgres-bank-account.repository.ts
packages/persistence/src/PostgresReportDataSource.ts
```

## Criterios de Aceptación

1. Dual versioning de `ai` eliminado (misma versión en api y packages/ai)
2. `bun run typecheck` pasa sin errores
3. `bun run test` pasa sin regresiones
4. Tests de AI swarm y agentes pasan
5. Tests fiscales (PBT) siguen pasando
6. Drizzle RQBv1→v2 preparado para 1.0 estable
