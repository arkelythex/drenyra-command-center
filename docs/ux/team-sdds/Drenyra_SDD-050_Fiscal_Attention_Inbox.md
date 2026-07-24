# SDD-050 — Fiscal Attention Inbox

**Estado:** PROPOSED  
**Depende de:** SDD-001, 002, 010–020, 037–041  
**Informa:** dashboard y vertical slices

## Decisión

La home profesional será una cola de atención, no un dashboard de scores. Unificará excepciones, vencimientos, revisiones, approvals, información faltante y ejecuciones que requieren intervención.

## Item canónico

Cada item incluye: tipo, company/period scope, objeto, severidad, impacto, vencimiento, responsable, estado, causa, next action y evidence refs. Priorización combina deadline, materialidad, bloqueos y policy; siempre es explicable.

## Vistas

- Mi atención.
- Sin responsable.
- Próximos vencimientos.
- Bloqueados.
- Revisión/aprobación.
- Automatizaciones que necesitan intervención.
- Portafolio por empresa.

## Reglas

1. Un health score no sustituye items.
2. Dismiss exige resolución, snooze con fecha o reason autorizado.
3. Resolver objeto actualiza todos los items derivados idempotentemente.
4. Aggregation multiempresa no permite bulk mutation material.
5. SLA y prioridad conservan fuente/policy.
6. Items stale se reconcilian, no permanecen como ruido.

## Criterios de aceptación

- JTBD-01 y JTBD-04 se completan desde la inbox.
- Cada item conduce a acción o explicación concreta.
- Tests cubren dedup, reprioritization, revocation y cross-tenant.
- Latencia soporta portafolio v1.
- Métricas distinguen resuelto, snoozed, stale y vencido.
