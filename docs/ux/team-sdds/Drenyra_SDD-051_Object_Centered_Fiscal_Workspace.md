# SDD-051 — Object-Centered Fiscal Workspace

**Estado:** PROPOSED  
**Depende de:** SDD-002, 013–020, 039  
**Informa:** SDD-052–056 y vertical slices

## Decisión

El workspace se centra en un objeto fiscal y una tarea. Chat, evidence, diff y activity son capacidades alrededor del objeto; no superficies que compiten por ser la aplicación principal.

## Estructura

- Header: nombre, estado, company, period y owner.
- Canvas: representación primaria del objeto.
- Inspector: campos, evidence, review y approval.
- Activity: eventos, jobs y comentarios.
- Agent composer: contextual y opcional.

## Reglas

1. URL identifica objeto/version y recupera contexto autorizado.
2. Selección es estable por ID/version.
3. Cambiar version muestra banner histórico y bloquea mutación accidental.
4. Acciones se agrupan por preparar, revisar, aprobar y más; no por origen técnico.
5. Un objeto incompleto muestra missing data como estado.
6. Workspace conserva filtros/scroll al abrir inspector.

## Criterios de aceptación

- Documento, conciliación, obligación y propuesta usan el mismo contrato.
- El agente nunca pierde referencia visible del objeto.
- Historical view no se confunde con current.
- Error en panel secundario no derriba canvas.
- Keyboard permite navegar canvas–inspector–activity.
