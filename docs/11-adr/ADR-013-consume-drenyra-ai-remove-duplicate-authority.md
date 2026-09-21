# ADR-013: Consumir Drenyra-AI publicado y eliminar la autoridad duplicada

**Fecha:** 2026-08-11
**Última actualización:** 2026-09-21
**Estado:** En progreso — autoridad migrada por capacidad; reducción física pendiente
**Alcance:** Drenyra (Command Center)
**Referencia:** [Drenyra AI — Gap Analysis](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md) (criterio v1.0 #1), [ADR-010](ADR-010-ecosystem-boundary-authority.md), [ADR-011](ADR-011-agent-model-ai-proposes-core-decides.md)

---

## Context

La frontera aprobada (ADR-010) exige que Drenyra consuma Drenyra-AI como runtime headless
independiente (librería/SDK/MCP) — nunca reimplementar gates ni mutar estado autoritativo.

**Estado verificado (2026-09-01):** este primer corte completa la migración de autoridad de `packages/mission-protocol`. Otras capacidades ya usan adaptadores, pero la reducción física del repositorio y las integraciones pendientes se evalúan por separado.

**Addendum (2026-09-21):** el repositorio vendorizaba dos versiones distintas de `drenyra-ai` en paralelo — `0.2.0` (usada aquí por `mission-protocol`, `mission-domain` y `drenyra-orchestrator`) y `0.4.1` (usada solo por `packages/pi`). Se verificó que el diff de `0.2.0` a `0.4.1` es aditivo o solo de comentarios para cada subpath que estos tres consumidores realmente importan (`missions`, `receipts`, `review`) — sin símbolos removidos ni cambiados — y se unificaron los tres en `drenyra-ai@0.4.1`, eliminando el tarball `0.2.0`. Las referencias a "v0.2.0" más abajo en este documento describen el estado histórico de ese primer corte y no se reescriben; el estado actual es v0.4.1 para las cuatro consumidoras del monorepo.

**Addendum (2026-09-21):** `apps/cli` (el terminal fiscal en Go) fue eliminado de este repositorio por decisión explícita del usuario, en favor del producto externo `drenyra-pi` como CLI/harness separado. Esta eliminación es independiente del alcance de este ADR (mission-protocol) y no lo modifica; se documenta aquí solo porque la sección "Límite de este corte" más abajo menciona `apps/cli` como fuera de alcance de esa migración — esa mención describe el estado en la fecha original de este ADR y no se reescribe. El estado actual de `apps/cli` (eliminado) se registra en `docs/14-design/ecosystem-reduction-plan.md`.

## Estado verificado

### Consumo del core — estado por capacidad

| Pieza | Estado |
| --- | --- |
| `packages/mission-domain` → `drenyra-ai/receipts` + `drenyra-ai/missions` | ✅ adapter shims (receipts, events, transitions, status, errors, contracts) |
| `packages/mission-protocol` → `drenyra-ai/missions` v0.2.0 | ✅ migrado en este corte: el barrel expone el contrato canónico completo y los módulos fuente de compatibilidad reexportan sus superficies existentes sin lógica local (`vendored/drenyra-ai-0.2.0.tgz`, `file:../../vendored/...`) |
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

### Límite de este corte

Este corte migra únicamente `packages/mission-protocol`. No elimina `apps/cli`, `packages/ai`, los paquetes fiscales, `packages/pi` ni `data-engine`; sus responsabilidades actuales siguen vigentes hasta que una migración posterior evalúe sus consumidores y límites.

La **migración de autoridad** sustituye una implementación local por consumo o adaptación hacia `drenyra-ai`. La **reducción física del repositorio** elimina paquetes o aplicaciones. La primera puede completarse por capacidad sin autorizar ni afirmar la segunda; la reducción amplia continúa pendiente.

## Decision

1. **Mantener adaptadores por capacidad.** `packages/mission-protocol` conserva el nombre de paquete y sus módulos fuente de compatibilidad, pero delega todo el contrato a `drenyra-ai/missions` v0.2.0.
2. **Publicar `drenyra-ai` en npm.** Cuando exista un artefacto de registry aprobado, sustituir el tarball vendored mediante una migración de dependencia separada.
3. **Evaluar integraciones y reducción por separado.** La posible integración de `ApprovalGateEngine` con `drenyra-ai/gates`, y cualquier retiro de aplicaciones o paquetes, requieren alcance y validación propios.

### Reglas de consumo

- Drenyra consume **el artefacto empaquetado** (tarball hoy → registry cuando se publique) —
  nunca un checkout ni un copy-paste del fuente.
- Los contratos congelados son la superficie de coordinación entre ambos repos; este corte fija `mission-protocol` en la versión vendored 0.2.0.

### Criterios de finalización (verificables)

- [x] `packages/mission-protocol` no contiene lógica de protocolo local y reexporta `drenyra-ai/missions` v0.2.0 desde el paquete raíz.
- [x] Los imports existentes del paquete raíz y de los módulos fuente de compatibilidad siguen resolviendo.
- [x] Los adaptadores ya registrados para `mission-domain` y `drenyra-orchestrator` se mantienen; este corte no amplía su alcance.
- [ ] Migraciones de autoridad restantes, integraciones opcionales y reducción física del repositorio se planifican y validan por capacidad.
- [ ] `drenyra-ai` se consume desde el registry npm cuando se publique un artefacto aprobado.

## Consecuencias

- **Beneficio**: `mission-protocol` deja de ser una segunda autoridad; los contratos canónicos y sus suites de conformidad gobiernan esa capacidad.
- **Costo**: los adaptadores y las versiones vendored deben mantenerse hasta disponer de un artefacto de registry aprobado.
- **Pendiente**: las demás migraciones e integraciones se validan por capacidad; este ADR no las declara completas.
- **No-goal**: este corte no cambia la UI, el dominio de producto ni el Command Center como superficie del contador, y no elimina aplicaciones ni paquetes.

## Referencias

- [Gap Analysis de drenyra-ai — criterio v1.0 #1](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md)
- [ADR-010 — Frontera y autoridad del ecosistema](ADR-010-ecosystem-boundary-authority.md)
- [ADR-011 — Los agentes proponen, el Core decide](ADR-011-agent-model-ai-proposes-core-decides.md)
