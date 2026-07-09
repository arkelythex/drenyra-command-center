# P5: Code Quality — Tasks

**Fecha:** 2026-07-07
**Review Workload Forecast:** 2 PRs · ~400 líneas · Chained PRs: No
**Decision needed before apply:** No

---

## PR 1: Biome Rules + tsconfig Strict (~200 líneas)

### T1.1: Endurecer biome.json

**Archivo:** `biome.json`
**Cambios:**

- `noExplicitAny`: `"warn"` → `"error"`
- `noUnusedImports`: `"warn"` → `"error"`
- `noUnusedVariables`: `"warn"` → `"error"`
- `noParameterAssign`: `"warn"` → `"error"`
- `noNonNullAssertion`: `"warn"` → `"error"`
- `noAccumulatingSpread`: `"warn"` → `"error"`
- Agregar regla `noConsoleLog` con nivel `"error"` y allow `["warn", "error", "info"]` (ya existe, verificar que está como `"error"` no `"warn"`)

### T1.2: Endurecer tsconfig.base.json

**Archivo:** `tsconfig.base.json`
**Cambios:**

- Agregar `"noUncheckedIndexedAccess": true`
- Agregar `"exactOptionalPropertyTypes": true`

### T1.3: Endurecer tsconfig.json (root)

**Archivo:** `tsconfig.json`
**Cambios:** Mismos flags que base.

### T1.4: Fix tsconfig.check.json

**Archivo:** `tsconfig.check.json`
**Cambios:** Remover los overrides que ponen `noUnusedLocals: false` y `noUnusedParameters: false`

### T1.5: Correr lint y arreglar errores

```bash
bun run lint:all
```

**Acción:** Para cada error nuevo:

1. Si es código legacy que necesita refactor → agregar `// biome-ignore` con justificación
2. Si es código activo → arreglar el error
3. Si es un falso positivo → reportar

---

## PR 2: Quality Tools + CI Gate (~200 líneas)

### T2.1: Instalar herramientas

```bash
bun add -d knip madge depcheck
```

### T2.2: Crear knip.json

**Archivo:** `knip.json` (nuevo, en raíz del proyecto)
**Contenido:** Config con entry points de todos los packages.

### T2.3: Agregar scripts a package.json

**Archivo:** `package.json`
**Cambios:**

```jsonc
"quality:dead-code": "knip",
"quality:circular": "madge --circular --ext ts,tsx apps/ packages/",
"quality:unused-deps": "depcheck",
"quality:all": "bun run quality:dead-code && bun run quality:circular && bun run quality:unused-deps"
```

### T2.4: Verificar que los tools funcionan

```bash
bun run quality:all
```

**Acción:** Reportar resultados de knip, madge, depcheck.

---

## After Apply: Verify

1. `bun run lint:all` — 0 errors
2. `tsc -p tsconfig.check.json` — 0 errors
3. `bun run quality:all` — pasa sin bloqueos
