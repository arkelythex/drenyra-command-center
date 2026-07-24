# SDD-033 — Density System

**Estado:** PROPOSED  
**Depende de:** SDD-030, SDD-032, SDD-036  
**Informa:** SDD-034–039

## Decisión

`compact`, `normal` y `spacious` serán contratos de layout medibles. Density modifica altura, padding, gap y truncation; no reduce touch targets por debajo de mínimos accesibles ni oculta información.

## Aplicación

- Compact: profesionales con teclado y data grids extensos.
- Normal: default de desktop.
- Spacious: aprendizaje, touch y lectura ejecutiva.

Cada componente declara los tokens que responde. Los icons, focus rings y hit areas mantienen legibilidad aunque el contenido sea compacto.

## Reglas

1. Density hereda globalmente y permite override local justificado.
2. Cambiar density no pierde scroll, selección o draft.
3. Modales críticos no se compactan hasta reducir comprensión.
4. Tablas pueden compactar filas, pero mantienen targets mediante row action menu accesible.
5. Screenshots y tests cubren las tres variantes.

## Criterios de aceptación

- Auditoría demuestra que componentes core consumen tokens de density.
- No existen paddings hardcodeados que bloqueen variants.
- Keyboard y touch targets cumplen SDD-036.
- Cambio de density no altera orden semántico.
- Virtualización recalcula correctamente alturas.
