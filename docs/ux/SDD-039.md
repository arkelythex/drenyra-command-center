# SDD-039 — Adaptive Workspace and Inspector

**Estado:** PROPOSED  
**Depende de:** SDD-030–038  
**Informa:** SDD-051–054 y vertical slices

## Decisión

El workspace será adaptativo. Canvas es permanente; inspector derecho, panel inferior y sidebar contextual aparecen solo cuando la tarea los necesita. No existe three-panel obligatorio.

## Modes

- **Focus:** canvas completo para tables/forms.
- **Inspect:** canvas + inspector de objeto.
- **Review:** navigation contextual + canvas diff + evidence/approval inspector.
- **Activity:** canvas + panel inferior de ejecución.

## Breakpoints conductuales

- Wide: inspector persistente redimensionable dentro de límites.
- Standard laptop: inspector overlay/push según workflow.
- Narrow/tablet: inspector drawer full-height.
- Mobile: vistas secuenciales; acciones sticky sin tapar contenido.

## Reglas

1. Layout state puede persistir por usuario/feature, no por empresa sensible.
2. Selección controla inspector; cerrar conserva foco en origen.
3. Paneles no reducen grid por debajo de ancho funcional.
4. Resize tiene keyboard alternative.
5. URLs pueden enlazar objeto/inspector sin serializar datos.

## Criterios de aceptación

- SIRE funciona en 1366 px sin canvas inutilizable.
- Focus restoration y screen reader order son correctos.
- No se renderizan paneles vacíos.
- Layout no pierde drafts o selection al cambiar mode.
- Visual tests cubren wide, laptop, tablet y mobile.
