# SDD-055 — Fiscal Cases, Tasks and Collaboration

**Estado:** PROPOSED  
**Depende de:** SDD-001, 010–015, 050–051

## Decisión

Un caso fiscal coordina un outcome; una tarea asigna trabajo concreto. Ninguno sustituye el objeto fiscal ni el periodo.

## Caso

Campos: type, title, company, period, status, priority, due date, owner, participants, linked objects, exceptions y evidence. Estados: `OPEN`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, `RESOLVED`, `CANCELLED`.

## Tarea

Campos: assignee, action, acceptance, due date, status y object refs. Estados: `TODO`, `DOING`, `BLOCKED`, `DONE`, `CANCELLED`. DONE requiere una condición verificable, no un checkbox sin resultado.

## Colaboración

Comentarios se anclan a caso, objeto/version o diff path. Mentions respetan membership. Solicitudes al cliente usan lenguaje separado y acceso mínimo. Attachments entran por ingestion/evidence, no quedan como blobs sin provenance.

## Reglas

1. Reasignar no cambia autoría histórica.
2. Cerrar caso no cierra periodo automáticamente.
3. Resolver excepción puede completar tarea mediante evento idempotente.
4. Cross-company cases están prohibidos para outcomes materiales iniciales.
5. Notification y activity se deduplican.

## Criterios de aceptación

- JTBD-09 y JTBD-10 tienen flujo completo.
- Responsables y blockers son consultables en portfolio.
- Comments/mentions no filtran datos cross-tenant.
- Estado se deriva de eventos consistentes.
- Audit distingue asignación, decisión y cambio fiscal.
