# L1: Legacy Cleanup — Dead Code & Deprecated Patterns

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 3
**Líneas estimadas:** ~900
**Depende de:** P5 (Code Quality), R1 (Eliminate Redundancy)
**Tags:** legacy, cleanup, dead-code, tech-debt

---

## Problema

Drenyra acumuló código legacy que ya no se usa, patrones deprecados, y archivos zombi que confunden y añaden ruido:

- **Dead code**: funciones, módulos, componentes que nadie importa (detectable con knip)
- **Código comentado**: bloques enormes `/* ... */` que deberían borrarse
- **Patrones obsoletos**: código que usa patterns que ya no son la convención (clases viejas, handlers manuales, state management legacy)
- **Migraciones a medias**: código que quedó de refactors anteriores (ej: vista vieja del dashboard que ya no se renderiza, `accountant-flow` legacy en E2E tests)
- **Archivos huérfanos**: archivos cuyo entry point ya no existe
- **Mock data / fixtures de desarrollo**: datos de prueba que se colaron en producción como defaults
- **`console.log`/`console.debug` en producción**: logging de debugging que quedó en el código

## Cambios Propuestos

### PR 1: Dead Code Elimination (~350 líneas)

**Qué:** Usar knip + madge para encontrar y eliminar código no usado.

**Acciones:**

1. Configurar knip correctamente con todos los entry points
2. `knip --production` → identificar exports no usados
3. Para cada archivo/export no usado:
   - **Si es export público de package**: marcar `@deprecated` con JSDoc + programar eliminación
   - **Si es interno y no se usa**: eliminar
   - **Si es archivo completo sin imports**: eliminar
4. Eliminar código comentado de más de 10 líneas
5. Eliminar `console.log`/`console.debug` (aplicar regla `noConsoleLog` de Biome)

**Herramientas:**

- `knip` — dead exports/files
- `madge --circular` — dependencias no usadas
- `unimported` — archivos sin entry point
- `ts-prune` — exports no usados en TypeScript

**Target por área:**

| Área                      | Archivos estimados a eliminar  | Riesgo                   |
| ------------------------- | ------------------------------ | ------------------------ |
| `apps/web`                | 15-25 componentes/hojas legacy | Bajo                     |
| `apps/api`                | 10-15 endpoints/handlers       | Medio                    |
| `packages/infrastructure` | 20-30 archivos viejos          | Alto — verificar imports |
| `packages/application`    | 5-10 use cases                 | Medio                    |
| `packages/shared`         | 5-10 helpers                   | Bajo                     |

### PR 2: Pattern Migration (300 líneas)

**Qué:** Migrar patrones obsoletos a los actuales.

**Acciones:**

1. **Clases → funciones**: Identificar clases que no necesitan `new`, migrar a factories/modules
2. **Manual fetch → feature adapters**: Código que aún usa `fetch()` directo sin pasar por los adapters
3. **Old state patterns → Zustand/TanStack Query**: Componentes que manejan estado con `useState` + `useEffect` para datos remotos
4. **Old routing → TanStack Router**: Código que referencia rutas viejas o usa `react-router-dom` legacy
5. **Old form patterns**: Formularios sin validación estructurada

### PR 3: Cleanup E2E + Dev Artifacts (~250 líneas)

**Qué:** Limpiar tests legacy y artifacts de desarrollo.

**Acciones:**

1. Eliminar `e2e/accountant-flow.spec.ts` (legacy — ya cubierto por `chat-flow.spec.ts`)
2. Eliminar `test-results/` y agregar a `.gitignore` si no está
3. Eliminar `coverage/` y agregar a `.gitignore`
4. Eliminar archivos de configuración legacy: `tsconfig-original.json`, `vitest.config-original.ts`, `tsconfig.domain-core-build.json` (si ya no se usan)
5. Eliminar mock data que sean fixtures de desarrollo en `data/`
6. Eliminar `logs/` del repo (agregar a `.gitignore`)

## Criterios de Aceptación

1. `knip --production` reporta 0 dead exports en entry points principales
2. 0 archivos con bloques comentados >10 líneas (verificable con `rg '/\*' | wc -l` baseline)
3. 0 `console.log`/`console.debug` en código de producción (Biome rule)
4. Archivos legacy identificados y eliminados o marcados `@deprecated`
5. `bun run typecheck` pasa
6. `bun run test` pasa sin regresiones
7. E2E tests legacy eliminados y `chat-flow.spec.ts` cubre todos los casos
