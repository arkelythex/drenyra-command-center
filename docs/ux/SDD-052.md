# SDD-052 — Evidence and Approval Inspector

**Estado:** PROPOSED  
**Depende de:** SDD-014, 015, 039, 051  
**Informa:** SIRE, IGV, cierre y filing

## Decisión

El inspector derecho será la superficie canónica para comprender y autorizar una propuesta. Ordenará: **Resumen → Impacto → Cambios → Evidencia → Validaciones → Decisiones → Reversibilidad**.

## Contenido obligatorio

- company, RUC, period y artifact version;
- preparador/agent;
- monto/materialidad;
- fuentes y rule versions;
- missing evidence;
- validations passed/failed;
- review/approval state;
- stale warning;
- apply/reversal semantics.

## Interacción

El inspector se abre desde selección o attention item. Reviewers comentan secciones específicas; approvers ven un resumen estable y pueden expandir. Aplicar requiere confirmación con scope y versión. Cerrar devuelve focus al origen.

## Reglas

1. Confidence score nunca es señal principal.
2. Approval buttons no aparecen si la propuesta está stale.
3. Evidence inaccessible se distingue de missing.
4. Apply no ocurre dentro de un tooltip/popover efímero.
5. Mobile usa step sequence sin ocultar secciones obligatorias.

## Criterios de aceptación

- Reviewer puede explicar una propuesta sin abrir otra ruta.
- Approval enlaza versión/diff exactos.
- Screen reader anuncia estado y errores.
- Tests cubren missing evidence, stale, denied y unknown.
- Inspector no reduce grid bajo ancho funcional.
