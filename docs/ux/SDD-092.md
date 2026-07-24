# SDD-092 — Visual Regression and Design QA

**Estado:** PROPOSED  
**Depende de:** SDD-030–039, SDD-091

## Decisión

Componentes y workflows core tendrán visual baselines por theme, density, viewport y estado. Visual regression complementa assertions semánticas; no aprueba cambios automáticamente por pixel difference.

## Matriz

- Light / Black OLED.
- compact / normal / spacious.
- wide / laptop / tablet / mobile.
- default / hover / focus / selected / disabled.
- loading / empty / partial / error / stale / locked.
- es-PE con textos largos y montos extremos.

## Proceso

Stories/fixtures deterministas, fonts estabilizadas, animations deshabilitadas en captura y datos sin PII. Diffs se revisan por owner del componente y feature. Cambiar baseline requiere razón en PR.

## Design QA manual

- jerarquía y legibilidad;
- keyboard/focus;
- truncation/overflow;
- numerales/alignments;
- contrast/high zoom;
- panel resizing;
- responsive transitions;
- error recovery.

## Criterios de aceptación

- Baselines cubren shell, context bar, grid, forms, inspector, diff e inbox.
- Ninguna actualización masiva de snapshots sin review.
- Contrast y layout assertions acompañan imágenes.
- Datos sensibles no aparecen en artifacts CI.
- Regresiones críticas bloquean rollout.
