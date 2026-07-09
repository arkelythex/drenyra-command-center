# P5: Code Quality & Technical Debt — Spec

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**Basado en:** Auditoría real del proyecto (tsconfig, biome.json, eslint)

---

## Estado Actual (Auditado)

### TypeScript Config

| Feature                      | tsconfig.base.json | tsconfig.check.json   | Problema                         |
| ---------------------------- | ------------------ | --------------------- | -------------------------------- |
| `strict: true`               | ✅                 | ✅ (inherits)         | OK                               |
| `noUnusedLocals`             | ✅ `true`          | ❌ `false` (override) | Check no detecta vars sin usar   |
| `noUnusedParameters`         | ✅ `true`          | ❌ `false` (override) | Check no detecta params sin usar |
| `noUncheckedIndexedAccess`   | ❌ No configurado  | ❌                    | Array access sin check           |
| `exactOptionalPropertyTypes` | ❌ No configurado  | ❌                    | Optional props flexibles         |

### Linting (Biome)

| Rule                   | Nivel actual                      | Problema                             |
| ---------------------- | --------------------------------- | ------------------------------------ |
| `noExplicitAny`        | `warn`                            | No bloquea CI, código con `any` pasa |
| `noUnusedImports`      | `warn`                            | No bloquea, imports muertos pasan    |
| `noUnusedVariables`    | `warn`                            | No bloquea                           |
| `noConsole`            | `warn` (allow: warn, error, info) | `console.log` pasa como warn         |
| `noParameterAssign`    | `warn`                            | No bloquea mutación de parámetros    |
| `noNonNullAssertion`   | `warn`                            | `foo!` pasa como warn                |
| `noAccumulatingSpread` | `warn`                            | No bloquea                           |

### Calidad General

| Herramienta              | Estado            |
| ------------------------ | ----------------- |
| `knip` (dead code)       | ❌ No configurado |
| `madge` (circular deps)  | ❌ No configurado |
| `depcheck` (unused deps) | ❌ No configurado |
| Quality CI gate          | ❌ No existe      |

---

## Cambios Específicos

### PR 1: Biome Rules + tsconfig Strict (200 líneas)

**A1: Endurecer Biome**

| Regla                  | Cambio           | Rationale                      |
| ---------------------- | ---------------- | ------------------------------ |
| `noExplicitAny`        | `warn` → `error` | Sin `any` sin justificación    |
| `noUnusedImports`      | `warn` → `error` | Imports muertos son ruido      |
| `noUnusedVariables`    | `warn` → `error` | Variables muertas son confusas |
| `noParameterAssign`    | `warn` → `error` | Mutar params causa bugs        |
| `noNonNullAssertion`   | `warn` → `error` | `foo!` evade type checking     |
| `noConsoleLog` (nuevo) | `error`          | Solo logger permitido          |
| `noAccumulatingSpread` | `warn` → `error` | Spread en loops es lento       |

**A2: Agregar Biome rule: `noRestrictedGlobals`**

Prohibir `parseInt` sin radix, `isNaN` (usar Number.isNaN), etc.

**A3: Endurecer tsconfig**

```jsonc
// tsconfig.base.json - agregar:
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

```jsonc
// tsconfig.check.json - FIX: habilitar checks de vars sin usar
// Remove the overrides that disable noUnusedLocals and noUnusedParameters
```

### PR 2: Quality Scripts + CI Gate (200 líneas)

**B1: Agregar herramientas**

```bash
bun add -d knip madge depcheck
```

**B2: Scripts en package.json**

```jsonc
{
  "scripts": {
    "quality:dead-code": "knip",
    "quality:circular": "madge --circular --ext ts,tsx packages/ apps/",
    "quality:unused-deps": "depcheck",
    "quality:all": "bun run quality:dead-code && bun run quality:circular && bun run quality:unused-deps",
  },
}
```

**B3: Script de CI `scripts/quality-check.sh`**

Corre en CI:

1. `biome check .` (con las reglas endurecidas)
2. `tsc -p tsconfig.check.json` (con strict flags)
3. `bun run quality:all` (knip + madge + depcheck)

Falla si cualquiera de los 3 pasos reporta errores.

---

## Criterios de Aceptación

1. `biome check .` pasa sin warnings (0 warnings, 0 errors)
2. `tsc -p tsconfig.check.json` pasa sin errors
3. `knip` reporta 0 exports sin usar
4. `madge` reporta 0 dependencias circulares
5. `depcheck` reporta 0 dependencias no usadas
6. Cualquier `any` tiene `eslint-disable-next-line` O `biome-ignore` con justificación
