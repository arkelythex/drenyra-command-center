# SDD-058 — Automations Control Center

**Estado:** PROPOSED  
**Depende de:** SDD-012, 019, 020, 056, 057

## Decisión

Automations serán recursos versionados con trigger, scope, owner, action level, schedule/event, policy, inputs, approvals, last/next run y health. Una automation nunca amplía permisos del creador.

## Lifecycle

`DRAFT → ACTIVE → PAUSED → DISABLED`; runs usan SDD-020. Cambiar acción, scope o policy crea versión y puede exigir reapproval.

## Creación

Wizard: objetivo → scope → trigger → acción → validadores → approval policy → preview → activate. “Run now” usa el mismo contrato durable e idempotente.

## Guardrails

- L3 exige autorización explícita y límites.
- Period closed bloquea o redirige según acción.
- Credentials se referencian desde vault, nunca se muestran.
- Rate/cost/volume limits obligatorios.
- Consecutive failures pausan según policy.
- Catch-up después de downtime es explícito; no dispara meses de runs silenciosos.

## UX

Lista por status y company, health, last result, next run y items que necesitan review. Run detail abre timeline/evidence. Pause es reversible; delete conserva historia.

## Criterios de aceptación

- Revocación y policy changes afectan runs futuros.
- Duplicate triggers no duplican side effects.
- Failure/unknown crea attention item.
- Usuario puede explicar qué hará antes de activar.
- Audit cubre create, edit, activate, pause y run.
