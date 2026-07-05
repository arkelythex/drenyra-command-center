# S2: Core Package Simplification

**Fecha:** 2026-07-04
**Autor:** el Gentleman

---

## Problema

`packages/drenyra-core/` es un package **virtualmente vacío** que solo contiene 8 definiciones de subagentes canónicos. Su existencia como package independiente no se justifica:

```
packages/drenyra-core/src/
├── index.ts      ← Re-export
├── types.ts      ← 8 subagent type definitions (~80 líneas)
└── __tests__/    ← Tests del export
```

Sin dependencias, sin lógica de negocio, sin framework. Es esencialmente un archivo de tipos que podría vivir en `packages/domain/src/agents/` donde ya existen tipos de agente.

## Solución Propuesta

**Mergear `@drenyra/drenyra-core` dentro de `@drenyra/domain`** en `packages/domain/src/agents/`:

```
ANTES:
  packages/drenyra-core/src/types.ts  ← 8 subagent definitions

DESPUÉS:
  packages/domain/src/agents/types.ts ← merge con tipos existentes
  packages/domain/src/agents/registry.ts ← ampliar registro canónico
```

### Detalle de merge

Los 8 subagentes actuales en drenyra-core:

```
ANALYST, RESEARCHER, CODER, REVIEWER, TESTER, DEVOPS, FISCAL, COORDINATOR
```

Ya existe `packages/domain/src/agents/types.ts` con tipos de agente del dominio fiscal. El merge implica:

1. Importar los tipos de drenyra-core en domain/agents/types.ts
2. Unificar bajo un mismo namespace de tipos
3. Eliminar el package drenyra-core
4. Actualizar imports en todos los consumidores

## Entregables

### PR único (estimado: ~150 líneas)

- Mover tipos a `packages/domain/src/agents/`
- Unificar con tipos existentes
- Actualizar imports en consumidores
- Eliminar `packages/drenyra-core/`
- Actualizar `apps/web/MAP.md` si referencia drenyra-core

## Consumidores a Actualizar

```bash
# Buscar imports de @drenyra/drenyra-core
rg "@drenyra/drenyra-core" apps packages --type ts -l
```

Lista tentativa (verificar con rg):

- `packages/domain/src/agents/` (tipos existentes)
- Posibles referencias en features de API o web
