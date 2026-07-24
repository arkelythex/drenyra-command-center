# SDD-016 — Accounting Diff and Materiality Engine

**Estado:** PROPOSED  
**Depende de:** SDD-013–015  
**Informa:** SDD-053, 074–077

## Decisión

El diff contable será semántico, no textual. Comparará versiones por objetos, campos, líneas, cuentas, impuestos y totales, y calculará impacto sin ocultar precisión o reglas de redondeo.

## Salida canónica

- artefactos base/target;
- adiciones, eliminaciones y modificaciones;
- cambios de clasificación;
- impacto débito/crédito;
- impacto tributario estimado;
- periodos y obligaciones afectadas;
- materialidad por policy;
- validaciones y warnings;
- elementos no comparables.

## Materialidad

Materialidad es rule/policy output, no color UI. Puede combinar monto absoluto, porcentaje, tipo de cuenta, obligación, proveedor, periodo y riesgo. La policy version se conserva. “No material” no significa “ignorable” ni autoriza apply automático.

## Invariantes

1. Base y target pertenecen al mismo scope salvo comparación histórica autorizada.
2. Moneda, escala y redondeo son explícitos.
3. Totales se recalculan server-side.
4. Orden visual no crea diferencias falsas.
5. Cambios de evidencia o rule version aparecen aunque el monto no cambie.
6. Diff output es determinista para los mismos inputs y policy.

## UX

Vista resumida primero; expansión por sección y línea. Números alineados, signos consistentes y before/after visibles. Color complementa iconos y texto. El usuario puede filtrar por materialidad, pero siempre ve el conteo oculto.

## Criterios de aceptación

- Golden fixtures cubren asientos, SIRE, IGV y rectificación.
- Mismos inputs producen mismo hash de diff.
- Balance y totales se verifican independientemente.
- UI funciona con miles de cambios mediante virtualización.
- Approval enlaza el diff exacto revisado.
