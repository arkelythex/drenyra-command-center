# SDD-053 — Accounting Review and Diff Workspace

**Estado:** PROPOSED  
**Depende de:** SDD-016, SDD-034, SDD-039, SDD-051, SDD-052

## Decisión

La revisión combinará diff semántico, navegación por cambios, comentarios y evidence inspector. No será un componente standalone desconectado del objeto.

## Layout

- Outcome navigation/filtros a la izquierda solo cuando haya secciones múltiples.
- Diff canvas central con summary y rows virtualizadas.
- Evidence/approval inspector contextual.

## Capacidades

- before/after y unified mode;
- filtros por cambio, materialidad, account y validation;
- comentarios anclados a artifact/version/path;
- mark reviewed por sección;
- request changes granular;
- keyboard next/previous change;
- export de review summary.

## Reglas

1. Reordenamiento no genera falso cambio.
2. Comentarios no migran silenciosamente a nueva versión; se marcan outdated.
3. Aprobar todo muestra secciones ocultas por filtro.
4. Totales y balances permanecen visibles.
5. Reviewer no aplica por accidente desde navegación.

## Criterios de aceptación

- Golden diffs de SIRE, asiento, IGV y rectificación.
- 10k cambios mantienen interacción fluida.
- Keyboard-only review es viable.
- Outdated comments y stale approval son visibles.
- Audit registra qué secciones se revisaron.
