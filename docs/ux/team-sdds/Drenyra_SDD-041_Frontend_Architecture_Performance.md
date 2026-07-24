# SDD-041 — Frontend Architecture and Performance

**Estado:** PROPOSED  
**Depende de:** SDD-003, SDD-005, SDD-030–040  
**Aplica a:** apps/web

## Decisión

El frontend conservará vertical slices con boundaries explícitos. Shared UI contiene primitives; domain components viven con su feature. Router state, server state, form state y ephemeral UI state tendrán ownership separado.

## Capas

- `app`: providers, routing y shell.
- `features`: workflows verticales.
- `entities/domain`: tipos y componentes semánticos compartidos.
- `ui`: primitives sin conocimiento fiscal.
- `lib`: clientes, schemas y utilidades estables.

Imports cruzados entre features pasan por public APIs. Ningún feature accede directamente a store interno de otro.

## Datos

- Query cache key incluye fiscal scope.
- Mutations invalidan keys exactas.
- Forms no duplican server cache como source of truth.
- Runtime schemas validan boundaries.
- Abort/cancel se aplica en context changes.

## Budgets

- Route chunks lazy-loaded por workflow.
- Shell inicial no incluye editores/diffs/agentes no usados.
- Long tasks >100 ms se registran.
- Grid y inspector evitan rerender de dataset completo por cambios locales.
- CI controla bundle budgets por entrypoint.

## Resiliencia

Error boundaries por route y panel, retry seguro, stale indicators, offline/degraded states y recovery de drafts. Un fallo en artifact feed no derriba el canvas.

## Criterios de aceptación

- Dependency rules automatizadas.
- No existen caches sin scope para datos tenant-owned.
- Bundles y Web Vitals tienen budgets y baseline.
- Profiling cubre SIRE 10k+ rows.
- Tests demuestran cancelación y ausencia de flash cross-company.
