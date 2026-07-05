# DS1 — Design Token Foundation (Cyan/Violet)

**Estado:** Proposal
**Creado:** 2026-07-05
**Supera:** `drenyra-fiscal-editorial-v3` (archivado)

---

## Problema

El proyecto tiene un sistema de tokens funcional (`tokens.dtcg.json` → `generated/tokens.css` → Tailwind `@theme`) pero con la paleta **cálida equivocada**: espresso (#161614), cream, voltage orange (#f54e00). El `index.css` tiene overrides forzando cyan/violeta (#3CE6D8 / #9B7FE8) como workaround, creando un conflicto visual entre los tokens generados y los overrides manuales.

El nuevo Design System (DESIGN.md, julio 2026) define una paleta **fría** con:

- Canvas: `#0B0E11` (dark) / `#FAFAF9` (light)
- Superficies: `#12161B`, `#1A1F26`, `#20262E`
- Bordes: `#262C34`, `#323A44`
- Texto: `#EDEFF2` (no blanco puro — APCA), `#A8B0BC`, `#6B7480`
- Acento primario: Cyan `#3CE6D8`
- Acento secundario: Violet `#9B7FE8`
- Estados fiscales: `#4ADE94` (success), `#F5B84A` (warning), `#F0665E` (error)

## Propuesta

1. **Actualizar `tokens.dtcg.json`** — reemplazar la paleta espresso/onyx/cream/voltage con la paleta cyan/violet del DS
2. **Regenerar `generated/tokens.css`** via `bun tokens:generate`
3. **Limpiar `index.css`** — remover overrides manuales que ya no hacen falta (los tokens generados son la fuente de verdad)
4. **Actualizar `SettingsContext.tsx`** — cambiar `applyCodexThemeTokens()` para usar los nuevos colores del DS
5. **Agregar colores semánticos fiscales** — `--state-success`, `--state-warning`, `--state-error`, `--state-pending`

## No-alcance

- No se toca tipografía (es DS2)
- No se toca layout (es DS5)
- No se migran componentes a los nuevos tokens (se hace en PR2)

## PRs

| PR  | Contenido                                                     | Archivos | Líneas est. |
| --- | ------------------------------------------------------------- | -------- | ----------- |
| PR1 | tokens.dtcg.json + generated/tokens.css                       | 2        | ~150        |
| PR2 | index.css cleanup + SettingsContext sync + colores semánticos | 3        | ~200        |

## Riesgos

- **Alto**: `bun tokens:generate` debe funcionar sin errores. Verificar que el script de generación acepte la nueva estructura.
- **Medio**: Componentes que usan CSS vars viejas (`--color-primitive-voltage-*`, `--color-primitive-espresso-*`) pueden romperse. PR2 debe auditar usos.
- **Bajo**: Los overrides en index.css pueden tener valores que los tokens nuevos no cubren exactamente.
