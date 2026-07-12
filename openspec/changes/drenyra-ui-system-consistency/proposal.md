# Proposal: UI System Consistency

**Change**: `drenyra-ui-system-consistency`
**Date**: 2026-07-12

## Problem

Drenyra web comparte un shell común (sidebar + composer + layout de tres paneles), pero las vistas internas fueron diseñadas con criterios distintos. Esto produce inconsistencia cognitiva: la app parece unificada visualmente pero no lo está operacionalmente.

### Evidencia

- **Composer no-contextual**: aparece completo (selector SIRE, chips, modes) en pantallas sin interacción agentic
- **Sidebar denso**: casos, nav items, footer compiten por atención; sin jerarquía colapsable
- **3+ layout widths**: cada página usa su propio ancho (760px inbox, 800px old, 1400px control tower, full facturas)
- **Radios/bordes inconsistentes**: cada pantalla define los propios
- **Estados vacíos sin continuidad**: inbox no muestra actividad reciente, control tower apenas carga
- **Facturas rompe el sistema**: bordes duros, uppercase, métricas grandes, estética distinta
- **Control Tower promete > capability**: naming exagerado para lo que entrega
- **Variables técnicas expuestas**: SIRE_SUBMISSION_MODE visible al usuario

## Proposed Change

Aplicar **8 reglas de consistencia** sobre el sistema actual:

1. **Shell adaptable**: composer contextual (expandido/compacto/oculto según pantalla)
2. **Sidebar reducido**: colapsar secciones secundarias, mover agentes a footer
3. **3 layouts oficiales**: focal (max-3xl), operativo (flex + inspector), data-heavy (full + padding)
4. **Sistema de radios declarado**: radius-sm/md/lg/xl con uso definido por componente
5. **Composer colapsable**: solo expandido en vistas agentic; compacto en data-heavy; oculto en settings/audit
6. **Estado vacío accionable**: actividad reciente debajo de dropzones, errores con acción de recuperación
7. **Facturas al sistema Drenyra**: reducir bordes, tipografía, métricas; toolbar estándar
8. **Control Tower → Centro de operaciones**: renombrar, mejorar estados vacíos, ocultar vars técnicas

## Acceptance Criteria

- [ ] Todas las páginas usan uno de los 3 layouts oficiales
- [ ] El composer es contextual: expandido/compacto/oculto según tipo de vista
- [ ] El sidebar tiene grupos colapsables y agentes en footer
- [ ] Los radios siguen el sistema declarado (8/10/12/16/20px)
- [ ] No hay variables técnicas visibles al usuario final
- [ ] Facturas comparte la gramática visual del resto del sistema
- [ ] Control Tower renombrada a Centro de operaciones con estados vacíos accionables
- [ ] El inbox muestra actividad reciente debajo del dropzone

## Non-goals

- No cambiar lógica de negocio, APIs, datos, o comportamiento fiscal
- No rediseñar la estructura funcional de las pantallas (solo su presentación)
- No agregar nuevas features o funcionalidades
- No cambiar el routing o la navegación entre páginas

## Size Estimate

**Muy grande**: ~2000-3000 líneas totales estimadas, divididas en 4-6 PRs encadenados.

### Batch 1 (~400-500 lines): Sistema de diseño base

- Tokens de radios (radius-sm/md/lg/xl)
- PageShell con enforcement de 3 layouts
- CSS variables para border weights consistentes

### Batch 2 (~400-500 lines): Sidebar + composer

- Sidebar colapsable por secciones
- Agentes movidos a footer
- Composer contextual (expandido/compacto/oculto)

### Batch 3 (~400 lines): Inbox + estados vacíos

- Dropzone reducido 30%
- Actividad reciente debajo
- Botón "Seleccionar archivos" con contorno estándar

### Batch 4 (~400-500 lines): Control Tower + Facturas

- Renombrar a Centro de operaciones
- Estados vacíos accionables
- Facturas al sistema Drenyra (bordes, tipografía, toolbar)

### Batch 5 (~300-400 lines): Ajustes finos

- Pipeline compacto en cierre
- Gate fiscal como línea de estado
- Naming fixes (Nuevo → Nuevo expediente, etc.)

## Risks

- **R1**: Sidebar refactor puede romper navegación existente — requiere tests de integración
- **R2**: Composer contextual puede confundir usuarios existentes — mantener colapsable visible
- **R3**: Cambio de bordes/tipografía en facturas puede generar resistencia — coordinar con equipo
- **R4**: Renombrar Control Tower requiere actualizar links/documentación externa
