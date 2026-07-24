# SDD-030 — Design Token Architecture

**Estado:** PROPOSED  
**Depende de:** SDD-003, SDD-005  
**Informa:** todo componente visual

## Decisión

Drenyra mantendrá DTCG como fuente y separará cuatro capas: **primitives → semantic tokens → component tokens → theme/density overrides**. No se colapsarán aliases legítimos ni se permitirán valores visuales hardcodeados en features.

## Namespaces

- `color.neutral.*`, `color.brand.*`, `color.status.*`, `space.*`, `size.*`, `type.*`, `motion.*` para primitives.
- `surface.canvas`, `surface.panel`, `text.primary`, `border.subtle`, `action.primary`, `status.critical` para semántica.
- `data-grid.row.height`, `context-bar.background`, `inspector.width` para componentes.
- Themes y density solo reasignan tokens autorizados.

## Reglas

1. Features consumen semantic/component tokens, no primitives de color.
2. Marca y estados permanecen separados.
3. Tokens de legacy se mapean, deprecian y miden antes de eliminar.
4. Cada token tiene descripción, tipo y consumidores.
5. Code generation es determinista y falla ante referencias rotas/ciclos.
6. Contraste se verifica sobre combinaciones semánticas.

## Migración

SDD-003 produce usage map. Los tokens se clasifican keep/alias/deprecate/delete. Un compatibility layer permite migración incremental con warnings de build para nuevos usos legacy.

## Criterios de aceptación

- Cero valores de marca/status duplicados fuera del source.
- Build valida tipos, referencias y contraste crítico.
- Light/OLED comparten semántica.
- Density no redefine color ni significado.
- Visual regression cubre los componentes base.
