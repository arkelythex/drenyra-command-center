# SDD-091 — Cross-layer Verification Strategy

**Estado:** PROPOSED  
**Depende de:** SDD-000, SDD-005  
**Aplica a:** todos los SDD

## Decisión

Cada comportamiento crítico se verificará en la capa más baja que pueda fallar y mediante al menos un escenario end-to-end. Mock-only no puede cerrar invariantes de PostgreSQL, concurrencia, autorización o adapters externos.

## Matriz

- Unit: reglas, state machines, policies, formatters.
- Property-based: invariantes numéricas, idempotencia y transitions.
- Contract: schemas/API/events/tools.
- Integration PostgreSQL real: scopes, constraints, transactions, fencing.
- Component: interaction, forms, grid, focus.
- E2E: workflow por rol/contexto.
- Failure injection: crash, timeout, duplicate, unknown, recovery.
- Security: tenant, permission, injection, export.
- Accessibility: automated y manual.
- Performance: datasets y concurrency representativos.

## Regla de evidencia

Cada acceptance criterion enlaza test, comando, resultado y artifact cuando corresponda. Flaky tests se corrigen o aíslan con owner/expiry; no se reintentan hasta verde como política permanente.

## Gates mínimos

Tenant-owned change requiere negative cross-tenant tests. Acción material requiere idempotency, stale approval y audit tests. UI crítica requiere keyboard/a11y. Job externo requiere timeout-after-success y reconciliation.

## Criterios de aceptación

- Traceability matrix SDD requirement → test.
- CI separa mandatory gates de diagnostics.
- PostgreSQL real ejecuta invariantes críticos.
- Failure injection reproducible.
- Ningún SDD pasa DONE con coverage solo cuantitativo.
