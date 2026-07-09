# P5: Code Quality — Design

**Fecha:** 2026-07-07

---

## Arquitectura

```text
                ┌──────────────────────┐
                │   PR 1: Biome + TS   │
                │   (~200 líneas)       │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ biome.json       │     │ tsconfig*.json    │
    │ (rules↑)         │     │ (flags↑)          │
    └──────────────────┘     └──────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  PR 2: Quality Tools  │
                │  (~200 líneas)       │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ package.json     │     │ scripts/         │
    │ (scripts)        │     │ quality-check.sh │
    └──────────────────┘     └──────────────────┘
```

## PR 1: Biome + TS Strict

### Archivos a modificar

| Archivo               | Cambio                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| `biome.json`          | Endurecer 7 reglas (warn→error), agregar 1 nueva                       |
| `tsconfig.base.json`  | Agregar `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`       |
| `tsconfig.check.json` | Sacar overrides que deshabilitan `noUnusedLocals`/`noUnusedParameters` |
| `tsconfig.json`       | Agregar misma flags que base                                           |

### Estrategia de aplicación

1. Modificar configs primero
2. `bun run lint:all` para ver qué aparece
3. Arreglar errores reales en los archivos reportados (solo los que aparecen)
4. Si hay falsos positivos, agregar biome-ignore con justificación

**NO** se busca arreglar TODO el código legacy — solo los archivos que rompan con las nuevas reglas. Los casos genuinos de `any` (ej: datos de SUNAT que llegan como `unknown`) pueden tener biome-ignore documentado.

## PR 2: Quality Tools

### Archivos nuevos

| Archivo                    | Propósito                                   |
| -------------------------- | ------------------------------------------- |
| `scripts/quality-check.sh` | Script CI que corre knip + madge + depcheck |
| `knip.json`                | Config de knip (project, entry points)      |

### Archivos a modificar

| Archivo                         | Cambio                                      |
| ------------------------------- | ------------------------------------------- |
| `package.json`                  | Agregar scripts de quality, agregar devDeps |
| `.github/workflows/quality.yml` | Nuevo workflow (opcional, si no existe CI)  |

### knip.json

```jsonc
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "apps/api/src/index.ts",
    "apps/web/src/main.tsx",
    "apps/web/src/router.tsx",
    "packages/domain/src/index.ts",
    "packages/application/src/index.ts",
    "packages/persistence/src/index.ts",
    "packages/infrastructure/src/index.ts",
    "packages/shared/src/index.ts",
    "packages/ai/src/index.ts",
    "packages/memory/src/index.ts",
    "packages/ui/src/index.ts",
    "packages/test-utils/src/index.ts",
  ],
  "project": ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
  "ignoreDependencies": ["@types/*"],
  "rules": {
    "exports": "error",
    "types": "error",
    "files": "warn",
    "dependencies": "warn",
    "unlisted": "warn",
    "binaries": "warn",
  },
}
```
