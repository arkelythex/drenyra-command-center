# ADR-013: Consumir Drenyra-AI publicado y eliminar la autoridad duplicada

**Fecha:** 2026-08-11
**Estado:** Propuesto — dirección y plan de migración; la ejecución es trabajo futuro por slices
**Alcance:** Drenyra (Command Center)
**Referencia:** [Drenyra AI — Gap Analysis](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md) (criterio v1.0 #1), [ADR-010](ADR-010-ecosystem-boundary-authority.md), [ADR-011](ADR-011-agent-model-ai-proposes-core-decides.md)

---

## Context

Drenyra (el Command Center) mantiene hoy **autoridad duplicada** del core de Drenyra-AI:
`packages/mission-protocol`, `packages/mission-domain`, `packages/domain` y
`packages/persistence` replican esquemas y lógica (protocolo de misiones, materialidad,
transiciones, schemas de almacenamiento) que ya existen como **contratos congelados y
verificados** en `drenyra-ai` (6 contratos FROZEN, 624 tests, conformance suites en CI).

La frontera aprobada (ADR-010) es explícita: **Drenyra consume Drenyra-AI como runtime
headless independiente (librería/SDK/MCP)**; nunca reimplementa gates ni muta estado
autoritativo. La duplicación actual viola esa frontera y crea un riesgo real: dos fuentes
de verdad para la misma regla fiscal, con drift posible entre ellas.

El criterio v1.0 #1 del gap analysis de drenyra-ai lo formaliza:
> *"Drenyra consumes the published package and removes its duplicate internal authority."*

## Decision

Migrar el Command Center a consumir **drenyra-ai publicado** (versión releaseada,
nunca un checkout), eliminando la autoridad duplicada por **slices verticales** — no un
movimiento masivo.

### 1. Inventario de duplicación (paso 0)

Antes de migrar, mapear cada pieza duplicada contra su contraparte en drenyra-ai:

| Pieza en Drenyra | Contraparte congelada en drenyra-ai | Subpath |
| --- | --- | --- |
| `packages/mission-protocol` (estados, transiciones) | `mission-protocol` contract + `missions/` | `drenyra-ai/missions` |
| `packages/mission-domain` / `packages/domain` (materialidad) | `candidate` contract + `candidates/materiality` | `drenyra-ai/candidates` |
| `packages/persistence` schemas (misión, eventos) | `recovery`/`ledger` contracts | `drenyra-ai/ledger`, `drenyra-ai/recovery` |
| Lógica de gates/aprobaciones propia | `gate` contract + `gates/` | `drenyra-ai/gates` |

### 2. Contrato de consumo

- Drenyra consume **la versión publicada** de `drenyra-ai` vía sus subpaths — nunca un checkout ni un copy-paste.
- Los contratos congelados (v0.1) son la superficie de coordinación entre ambos repos.
- Las versiones se coordinan por release; Drenyra fija la versión que consume.

### 3. Slices verticales de migración

1. **Receipts + ledger**: reemplazar la verificación de receipts y la validación del ledger propias por `drenyra-ai/receipts` y `drenyra-ai/ledger`.
2. **Materialidad de candidatos**: reemplazar la derivación propia por `drenyra-ai/candidates` (BigInt cents, reglas del contrato).
3. **Protocolo de misiones**: reemplazar `packages/mission-protocol` por `drenyra-ai/missions` (`MissionRuntime`, estados, transiciones).
4. **Gates y aprobaciones**: reemplazar la lógica propia por `drenyra-ai/gates` (R2/R3, fail-closed).
5. **Persistence**: los schemas de almacenamiento pasan a ser proyecciones del estado autoritativo de drenyra-ai (los adapters PostgreSQL de drenyra-ai son la implementación de referencia).

Cada slice: **mismo comportamiento antes/después** (los tests de Drenyra que ejercen la regla deben pasar contra el subpath de drenyra-ai), luego **eliminar la copia interna**.

### 4. Criterios de finalización (verificables)

- [ ] `drenyra-ai` aparece como dependencia publicada (nunca un checkout) en el manifest de Drenyra.
- [ ] Cero código duplicado del core: los paquetes `mission-protocol`, `mission-domain` y los schemas duplicados en `persistence` son eliminados o convertidos en adaptadores.
- [ ] La suite de Drenyra pasa íntegra contra los subpaths de drenyra-ai.
- [ ] `drenyra-ai capabilities show` (o el MCP `capabilities`) es la fuente de verdad de contratos/skills/jurisdicciones que Drenyra declara.
- [ ] Ningún path de ejecución del Command Center muta estado autoritativo fuera de drenyra-ai.

## Consecuencias

- **Beneficio**: una sola autoridad fiscal; los contratos congelados y sus conformance suites gobiernan; drift entre repos imposible por construcción.
- **Costo**: coordinación de versiones entre repos y trabajo de migración por slice (no un big-bang).
- **No-goal**: este ADR no cambia la UI, el dominio de producto de Drenyra (dashboards, bandejas, aprobaciones de UX) ni el Command Center como superficie del contador — solo la autoridad fiscal subyacente.

## Referencias

- [Gap Analysis de drenyra-ai — criterio v1.0 #1](https://github.com/arkelythex/drenyra-ai/blob/main/docs/roadmaps/2026-08-10-v1-gap-analysis.md)
- [ADR-010 — Frontera y autoridad del ecosistema](ADR-010-ecosystem-boundary-authority.md)
- [ADR-011 — Los agentes proponen, el Core decide](ADR-011-agent-model-ai-proposes-core-decides.md)
