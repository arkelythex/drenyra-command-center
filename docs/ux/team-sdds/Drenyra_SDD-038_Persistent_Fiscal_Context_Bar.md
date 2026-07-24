# SDD-038 — Persistent Fiscal Context Bar

**Estado:** PROPOSED  
**Depende de:** SDD-010, SDD-011, SDD-037  
**Informa:** toda acción material

## Decisión

La context bar mostrará organización cuando sea relevante, empresa, RUC enmascarado/visible según policy, periodo y lifecycle. Es control de seguridad y orientación, no breadcrumb decorativo.

## Interacciones

- Cambiar empresa abre selector searchable con recientes y status.
- Cambiar periodo lista solo periodos autorizados y muestra lifecycle.
- Cambios con dirty draft presentan opciones Guardar borrador, Descartar o Permanecer.
- Un periodo CLOSED/LOCKED modifica acciones disponibles y explica el camino correcto.
- La confirmación de acciones críticas repite empresa, RUC y periodo.

## Reglas

1. Contexto visual deriva del contexto verificado retornado por servidor.
2. Seleccionar no concede membership.
3. Deep link resuelve y valida antes de renderizar contenido sensible.
4. Cambio invalida selection y aborta requests incompatibles.
5. Caches se keyean por scope completo.
6. Nunca se presentan simultáneamente datos de la empresa anterior como si fueran actuales.

## Criterios de aceptación

- Empresa/periodo se identifica en menos de una mirada durante tests.
- No hay flash de datos cross-company.
- Dirty, jobs activos y CLOSED period tienen comportamiento definido.
- Keyboard y mobile permiten cambio seguro.
- Confirmaciones materiales repiten el scope efectivo.
