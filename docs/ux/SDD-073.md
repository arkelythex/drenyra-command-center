# SDD-073 — Banking Reconciliation Workspace

**Estado:** PROPOSED  
**Depende de:** SDD-010–020, 034, 050–056

## Decisión

La conciliación bancaria comparará movimientos bancarios y registros contables mediante matches deterministas/heurísticos explicables. La IA puede preparar sugerencias L2; confirmar match o generar propuesta contable requiere usuario/policy.

## Estados de movimiento

`UNMATCHED`, `SUGGESTED`, `MATCHED`, `PARTIAL`, `DUPLICATE`, `EXCLUDED`, `NEEDS_ATTENTION`.

## Reglas

- Cuenta bancaria pertenece a company scope.
- Import batches tienen identidad y dedup.
- Un movimiento puede relacionarse many-to-one/one-to-many con suma y tolerancia explícitas.
- Heurística registra features/reason, no “AI confidence” aislada.
- Confirmación crea reconciliation artifact versionado.
- Reabrir match preserva historial.
- Diferencias de moneda requieren rate/source/fecha.

## UX

Tres colas: pendientes, sugeridos y conciliados. Canvas permite side-by-side, split/merge y explicación. Bulk confirm solo para reglas homogéneas con preview; mixed-company prohibido.

## Criterios de aceptación

- Totales de inicio, movimientos, conciliado y pendiente cuadran.
- Duplicate imports no duplican saldo.
- Suggestions se reproducen con rule/model version.
- Keyboard soporta flujo de alto volumen.
- Reversal y period close siguen SDD-011/017.
