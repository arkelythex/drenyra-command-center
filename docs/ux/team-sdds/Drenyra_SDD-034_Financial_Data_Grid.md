# SDD-034 — Financial Data Grid

**Estado:** PROPOSED  
**Depende de:** SDD-013, SDD-030–033, SDD-036  
**Informa:** SIRE, banca, IGV, diff y auditoría

## Decisión

Drenyra tendrá un data grid financiero canónico para grandes volúmenes. Soportará virtualización, keyboard navigation, pinned columns, filtros, grouping, totales, selección y edición controlada sin convertir cada feature en una implementación propia.

## Capacidades

- column schema tipado;
- server-side sort/filter/pagination cuando el volumen lo requiera;
- virtualización de filas y columnas;
- sticky identifiers y totals;
- selection estable por ID/version, no índice;
- bulk actions con preview y scope único;
- edición con validation y optimistic concurrency;
- export que respeta filtros y permisos;
- estados loading, empty, partial, stale y error.

## Reglas financieras

Montos declaran currency/scale; totales se calculan server-side o con algoritmo idéntico verificado. Null no suma como cero sin regla. Filas de distintas empresas no participan en acciones materiales masivas. El grid muestra conteo de filas ocultas por filtro.

## Accesibilidad

Semántica grid/table según interacción, navegación documentada, focus visible, announcements de sort/filter y alternativa no virtualizada para assistive tech cuando sea necesaria.

## Budgets

- Primera interacción usable en dataset de referencia sin bloquear main thread más de 100 ms continuos.
- Scroll sostenido sin pérdida de input.
- Operaciones de 50k filas usan server-side processing.

## Criterios de aceptación

- Golden datasets prueban 1k, 10k y 50k filas.
- Selection sobrevive sort/filter sin cambiar objetos.
- Totales concuerdan con backend.
- Keyboard permite completar revisión básica.
- SIRE y banca reutilizan el mismo primitive.
