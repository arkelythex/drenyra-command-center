# S6: Documentation & Navigation Cleanup

**Fecha:** 2026-07-04
**Autor:** el Gentleman

---

## Problema

La documentación de navegación del monorepo tiene 2 issues:

### 1. CODEX-MAP.md tiene filas duplicadas

```text
| `packages/ui` | ui | Shared Glass & Steel design-system... | frontend, ui, design-system |  — |
| `packages/ui` | ui | Shared Glass & Steel design-system... | frontend, ui, design-system |  — |
```

Cada fila de la tabla de packages aparece **2 veces** (duplicación exacta). Esto es un bug en el generador `scripts/codebase/generate-index.ts`.

### 2. Múltiples MAP.md con formatos divergentes

Existen:

- `CODEX-MAP.md` (monorepo root)
- `apps/api/MAP.md`
- `apps/web/MAP.md`
- `apps/data-engine/MAP.md`
- `apps/drenyra-cli/MAP.md`

Cada MAP.md usa un formato ligeramente distinto — algunos son bilingües, otros no, algunos tienen tablas de contenido, otros no.

## Solución Propuesta

### PR 1: Fix CODEX-MAP Generator (estimado: ~50 líneas)

- El bug está en `scripts/codebase/generate-index.ts` — la tabla se genera duplicando filas
- **NO editar CODEX-MAP.md directo** — se regenera con `bun run codebase:index`
- Arreglar el generador y regenerar

### PR 2: MAP.md Format Unification (estimado: ~50 líneas)

- Definir un template estándar para MAP.md con:
  - Sección "Si solo tenés tres minutos" / "If you only have three minutes"
  - Tabla de arquitectura con formato consistente
  - Fast search recipes
  - Common tasks → exact paths
- Aplicar template a todos los MAP.md que lo necesiten

## Dependencia

Este plan debe ejecutarse **DESPUÉS** de S1, S3 y S4, porque esos planes cambian la estructura de packages que los MAP.md documentan. No tiene sentido arreglar docs sobre una estructura que va a cambiar.
