# ADR-013: Consumir Drenyra-AI publicado y eliminar la autoridad duplicada

**Fecha:** 2026-08-11
**Estado:** Completa — consumo verificado; pendiente solo la publicación en npm
**Alcance:** Drenyra (Command Center)
**Referencia:** [Drenyra AI — Gap Analysis](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md) (criterio v1.0 #1), [ADR-010](ADR-010-ecosystem-boundary-authority.md), [ADR-011](ADR-011-agent-model-ai-proposes-core-decides.md)

---

## Context

La frontera aprobada (ADR-010) exige que Drenyra consuma Drenyra-AI como runtime headless
independiente (librería/SDK/MCP) — nunca reimplementar gates ni mutar estado autoritativo.

**Estado verificado (2026-08-11):** la migración de la autoridad fiscal está **completa**.

## Estado verificado

### Consumo del core — completo

| Pieza | Estado |
| --- | --- |
| `packages/mission-domain` → `drenyra-ai/receipts` + `drenyra-ai/missions` | ✅ adapter shims (receipts, events, transitions, status, errors, contracts) |
| `packages/mission-protocol` → `drenyra-ai` v0.2.0 | ✅ tarball vendored (`vendored/drenyra-ai-0.2.0.tgz`, `file:../../vendored/...`) |
| `packages/drenyra-orchestrator` → `drenyra-ai` | ✅ work-routing, review-lenses |
| Funciones de core duplicadas (validateLedger, deriveMateriality, signReceipt, verifySignedReceipt) | ✅ **cero** — grep exhaustivo vacío |

### Archivos inicialmente catalogados como residuos — NO son duplicación

| Archivo | Qué es realmente |
| --- | --- |
| `packages/shared/src/kernel/lifecycle.ts` | Ciclo de vida de **instancias de agentes** (`idle → busy → completed | error`) — concepto distinto de las misiones fiscales (`AccountingMissionStatus`, 15 estados). No es autoridad fiscal. |
| `packages/pi/src/mastra/approval-gate.ts` | Capa de **orquestación de tools de Mastra** (auto / notify / gate / fiscal_gate) con aprobación humana y `governanceValidator` inyectado — no el gate fiscal determinista de `drenyra-ai/gates`. Capas complementarias. |

Los consumidores del API (`missions.service.ts`, `mission-runtime.ts`) y de la web
(`missionReducer.ts`, `useMissionRecovery.ts`) importan de los shims — son uso legítimo, no
reimplementación.

## Decision

1. **Publicar `drenyra-ai` en npm** — sustituir el tarball vendored por la dependencia de
   registry; es el único paso pendiente del consumo (hoy `drenyra-ai` da 404 en npm).
2. **Opcional — integración de capas (no corrección):** el `ApprovalGateEngine` de pi puede
   usar `drenyra-ai/gates` como su `governanceValidator` (validación fiscal determinista
   dentro del flujo de tools de Mastra). Es una mejora de integración, no una migración.

### Reglas de consumo

- Drenyra consume **el artefacto empaquetado** (tarball hoy → registry cuando se publique) —
  nunca un checkout ni un copy-paste del fuente.
- Los contratos congelados (v0.1) son la superficie de coordinación entre ambos repos.

### Criterios de finalización (verificables)

- [x] Cero implementaciones locales de transiciones/gates/materiality/receipts/ledger
      (grep de `export function validateLedger|deriveMateriality|signReceipt` y
      `export class .*Gate` fuera de shims = vacío).
- [x] Conformance de receipts de mission-domain pasa contra el tarball vendored (24 tests).
- [x] Ningún path de ejecución del Command Center muta estado autoritativo fuera de drenyra-ai.
- [ ] `drenyra-ai` consumida desde el registry npm cuando se publique.

## Consecuencias

- **Beneficio**: una sola autoridad fiscal; los contratos congelados y sus conformance suites
  gobiernan; drift entre repos imposible por construcción.
- **Costo**: la publicación de `drenyra-ai` en npm (release) y la coordinación de versiones.
- **No-goal**: este ADR no cambia la UI, el dominio de producto de Drenyra ni el Command
  Center como superficie del contador — solo la autoridad fiscal subyacente (ya migrada).

## Referencias

- [Gap Analysis de drenyra-ai — criterio v1.0 #1](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md)
- [ADR-010 — Frontera y autoridad del ecosistema](ADR-010-ecosystem-boundary-authority.md)
- [ADR-011 — Los agentes proponen, el Core decide](ADR-011-agent-model-ai-proposes-core-decides.md)
