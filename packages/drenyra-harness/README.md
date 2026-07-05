---
last-verified: 2026-06-20
source-of-truth: packages/drenyra-harness/package.json
auto-generated: false
---

# @drenyra/harness

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Harness soberano de agentes para DRENYRA Drenyra** — orquestación en runtime con:

- Grafo de delegación (tier0 → tier1 → tier2 → tier3 → tier3b)
- Enforcement de profundidad máxima
- Gates de aprobación humana para acciones fiscales materiales
- `AgentHandler` plugueable por id de agente (LLM/tools se conectan aquí)

## ¿Para qué sirve?

Mientras que los agentes de Cursor funcionan en el IDE del desarrollador, el **harness** es el runtime que los operadores de Drenyra usan en producción. Está diseñado para ser tenant-aware, auditabl y fiscalmente responsable.

## Uso

```typescript
import { createDrenyraHarness } from "@drenyra/harness";

const harness = createDrenyraHarness({
  onApprovalRequired: async ({ agentId, task }) => {
    // integrar con UI / DB de aprobación Drenyra
    return false;
  },
});

const result = await harness.execute({
  task: "Validar SIRE periodo 2024-01",
  context: {
    sessionId: "...",
    organizationId: "...",
    companyId: "...",
    companyRuc: "20601234567",
    period: "2024-01",
    traceId: "...",
  },
  autoSpawn: true,
});
```

## HTTP (Drenyra API)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/fiscal-command-center/harness/execute` | Ejecutar tarea en el harness |
| GET | `/api/fiscal-command-center/harness/agents` | Listar agentes disponibles |
| POST | `/api/fiscal-command-center/harness/spawn` | Spawnear nuevo agente |

Requiere headers de contexto fiscal (mismos que el fiscal command center).

## Cursor vs Harness

| Aspecto | Cursor `.cursor/agents/` | `@drenyra/harness` |
|---------|--------------------------|----------------------|
| Usuario | Desarrolladores | Operadores / Drenyra web |
| Runtime | IDE | Bun / API / worker |
| Tenant | No | RUC, periodo, org |
| Aprobación | PR | Gates SUNAT / contables |

## Tests

```bash
cd packages/drenyra-harness && bun run test
```
