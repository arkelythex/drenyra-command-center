# ADR-013: Consumir Drenyra-AI publicado y eliminar la autoridad duplicada

**Fecha:** 2026-08-11
**Estado:** En ejecución — la migración ya está en curso; quedan residuos acotados
**Alcance:** Drenyra (Command Center)
**Referencia:** [Drenyra AI — Gap Analysis](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md) (criterio v1.0 #1), [ADR-010](ADR-010-ecosystem-boundary-authority.md), [ADR-011](ADR-011-agent-model-ai-proposes-core-decides.md)

---

## Context

La frontera aprobada (ADR-010) exige que Drenyra consuma Drenyra-AI como runtime headless
independiente (librería/SDK/MCP) — nunca reimplementar gates ni mutar estado autoritativo.

**Estado verificado (2026-08-11):** la migración del core ya está **en curso y mayormente
completa**. `packages/mission-domain` y `packages/mission-protocol` ya consumen
`drenyra-ai` v0.2.0 como **tarball vendored** (`vendored/drenyra-ai-0.2.0.tgz`,
`file:../../vendored/...`), y el core de receipts/events/transitions/status/errors es un
**adapter shim** hacia `drenyra-ai/receipts` y `drenyra-ai/missions`. El orquestador
(`packages/drenyra-orchestrator`) también consume `drenyra-ai`.

Quedan **dos residuos acotados** de duplicación:

| Residuo | Contraparte en drenyra-ai |
| --- | --- |
| `packages/shared/src/kernel/lifecycle.ts` (transiciones propias) | `drenyra-ai/missions` (`VALID_TRANSITIONS`, runtime) |
| `packages/pi/src/mastra/approval-gate.ts` (ApprovalGate propio) | `drenyra-ai/gates` (aprobación R2/R3, fail-closed) |

## Decision

Completar la migración por **slices acotados** — no un movimiento masivo:

### Slices restantes

1. **`shared/kernel/lifecycle.ts`**: reemplazar las transiciones propias por
   `drenyra-ai/missions` (mismo comportamiento antes/después; la suite de `shared`
   debe pasar contra el subpath).
2. **`pi/mastra/approval-gate.ts`**: reemplazar el `ApprovalGate` propio por
   `drenyra-ai/gates` (R2 single / R3 dual distinct, fail-closed runner).
3. **Publicar en npm**: sustituir el tarball vendored por la dependencia de registry
   (`drenyra-ai` publicada); el tarball vendored fue el paso transitorio correcto.

### Reglas de consumo

- Drenyra consume **el artefacto empaquetado** (tarball → registry) — nunca un checkout
  ni un copy-paste del fuente.
- Los contratos congelados (v0.1) son la superficie de coordinación entre ambos repos.
- Versiones coordinadas por release; Drenyra fija la versión que consume.

### Criterios de finalización (verificables)

- [ ] `shared/kernel/lifecycle` y `pi/mastra/approval-gate` migrados a subpaths de drenyra-ai.
- [ ] Cero implementaciones locales de transiciones/gates/materiality/receipts/ledger
      (grep de `export function validateLedger|deriveMateriality|signReceipt` y
      `export class .*Gate` fuera de shims = vacío).
- [ ] La suite de Drenyra pasa íntegra contra los subpaths de drenyra-ai.
- [ ] `drenyra-ai` consumida desde el registry npm (no el tarball vendored) cuando se publique.
- [ ] Ningún path de ejecución del Command Center muta estado autoritativo fuera de drenyra-ai.

## Consecuencias

- **Beneficio**: una sola autoridad fiscal; los contratos congelados y sus conformance suites
  gobiernan; drift entre repos imposible por construcción.
- **Costo**: coordinación de versiones entre repos y la publicación de `drenyra-ai` en npm.
- **No-goal**: este ADR no cambia la UI, el dominio de producto de Drenyra ni el Command
  Center como superficie del contador — solo la autoridad fiscal subyacente (ya migrada en
  su mayor parte).

## Referencias

- [Gap Analysis de drenyra-ai — criterio v1.0 #1](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md)
- [ADR-010 — Frontera y autoridad del ecosistema](ADR-010-ecosystem-boundary-authority.md)
- [ADR-011 — Los agentes proponen, el Core decide](ADR-011-agent-model-ai-proposes-core-decides.md)
