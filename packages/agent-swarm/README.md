---
last-verified: 2026-06-20
source-of-truth: packages/agent-swarm/ (frozen)
auto-generated: false
---

# @arkelythex/agent-swarm — FROZEN / DEPRECATED

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

> **⚠️ Este paquete está congelado.** Su funcionalidad fue reemplazada por `packages/drenyra-orchestrator` (orquestación Mastra) y `packages/arkelythex-harness` (grafo de delegación + gates de aprobación).

## ¿Qué pasó?

Originalmente este paquete contenía el sistema de multi-agente para procesamiento de facturas peruanas. Con la evolución de la arquitectura Drenyra, ese código se refactorizó en piezas más especializadas:

| Concepto Anterior | Ubicación Actual |
|---|---|
| Orquestación de agentes | `packages/drenyra-orchestrator/` |
| Grafo de delegación / harness | `packages/arkelythex-harness/` |
| Tipos core de agente (snapshot) | `packages/drenyra-orchestrator/src/types/` |
| Agentes de compliance | Migrados inline a los workflows de orquestación |

El código en `src/` se conserva solo como referencia. No agregues nuevos imports desde este paquete — no tiene `package.json` publicable.

---

**Status**: Frozen
