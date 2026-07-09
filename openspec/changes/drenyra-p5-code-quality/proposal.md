# P5: Code Quality & Technical Debt

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~400
**Depende de:** Nada (quick win, paralelo con todo)

---

## Problema

El monorepo de Drenyra ha crecido rápido. El código funciona, pero la calidad no está garantizada por herramientas:

- `tsconfig.json` usa `strict: false` o configuraciones laxas en packages
- No hay lint rules específicas para el dominio fiscal
- Código muerto (funciones, exports, componentes sin usar)
- Dependencias no auditadas (versiones, duplicadas, no usadas)
- Convenciones de código no enforceadas automáticamente

Para un proyecto de infraestructura contable, el código debe ser tan estricto como las reglas fiscales que implementa.

## Cambios Propuestos

### PR 1: Strict TypeScript + ESLint Configuration (200 líneas)

**Qué:** Endurecer TypeScript y ESLint en todos los packages.

**TypeScript strict en todos los packages:**

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
  },
}
```

**ESLint rules específicas:**

- `@typescript-eslint/no-explicit-any` — error (excepto casos justificados con comentario)
- `@typescript-eslint/strict-boolean-expressions` — evitar truthiness implícitos
- `no-console` — error (usar logger)
- `no-param-reassign` — error (mutaciones)
- Custom rule: fiscal-amount-validator (no usar `number` para montos, usar `Money`)

### PR 2: Dead Code Elimination + Quality Gates (200 líneas)

**Qué:** Eliminar código no usado + gates automáticos.

**Herramientas:**

- `knip` (también conocido como `ts-prune`) — detectar exports no usados
- `depcheck` — detectar dependencias no usadas en package.json
- `madge` — detectar dependencias circulares

**Scripts:**

- `bun run quality:knip` — reporta código muerto
- `bun run quality:circular` — detecta dependencias circulares
- `bun run quality:depcheck` — detecta dependencias no usadas
- `bun run quality:all` — corre todos los checks

**Quality gate en package.json:**

```jsonc
{
  "scripts": {
    "quality:all": "bun run quality:knip && bun run quality:circular && bun run quality:depcheck",
    "quality:ci": "bun run quality:all --fail-on-error",
  },
}
```

## Criterios de Aceptación

1. `tsc --strict` pasa en todos los packages sin errors
2. ESLint corre sin warnings en CI
3. `knip` reporta 0 exports sin uso
4. `madge` reporta 0 dependencias circulares
5. `depcheck` reporta 0 dependencias no usadas
6. Cualquier `any` tiene un comentario `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- justificación`
