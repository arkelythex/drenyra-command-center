# D1: Dependency Modernization

**Fecha:** 2026-07-09
**Actualizado:** 2026-07-09 (basado en investigación web de julio 2026)
**Autor:** el Gentleman
**PRs estimados:** 5
**Líneas estimadas:** ~1200
**Depende de:** P5 (Code Quality), P6 (Package Health)
**Tags:** dependencies, updates, security, modernization, breaking-changes

---

## Problema

Drenyra tiene 1000+ dependencias en `node_modules` (bun.lock de 400KB). Investigación web de julio 2026 reveló **gaps críticos** que no estaban en la versión original del plan:

### Hallazgos de investigación (julio 2026)

| Dep             | Versión en Drenyra | Latest (julio 2026) | Delta                   | Riesgo   |
| --------------- | ------------------ | ------------------- | ----------------------- | -------- |
| Bun             | 1.3.14             | 1.3.14              | ✅ Ya latest            | —        |
| Elysia          | 1.4.29             | 1.4.29              | ✅ Ya latest            | —        |
| React           | ^19.2.7            | 19.2.7              | ✅ Ya latest            | —        |
| TanStack Router | ^1.103.3           | latest              | ✅ Parece current       | —        |
| Vitest          | 4.1.8              | latest              | ✅ Parece current       | —        |
| Biome           | ^2.5.0             | 2.5.3               | ⚠️ Minor (patch)        | Bajo     |
| Tailwind CSS    | ^4.1.18            | 4.3 (May 2026)      | ⚠️ Minor                | Bajo     |
| Playwright      | ?                  | 1.61.0 (Jun 2026)   | ❓ Por verificar        | Medio    |
| Drizzle ORM     | ^0.45.2            | 1.0.0-rc.4          | 🔴 MAJOR (0.x → 1.0 RC) | **Alto** |
| AI SDK          | ^6.0.x (dual!)     | v7 (Jun 25, 2026)   | 🔴 MAJOR (v6 → v7)      | **Alto** |
| Knip            | No instalado       | 6.23.0              | 🆕 Nueva herramienta    | —        |

### Dual versioning confirmado

- `ai`: `^6.0.39` en `apps/api` vs `^6.0.206` en `packages/ai` — dos versiones distintas de AI SDK
- Esto significa que el lockfile tiene dos copias de la misma librería

### Migraciones con breaking changes

1. **Drizzle ORM 0.45 → 1.0 RC**: `db.query...findFirst/findMany` (Relational Queries v1) fue eliminado. Drenyra tiene **20+ usos** de esta API en `packages/persistence/src/`. Migrar a Relational Queries v2.
2. **AI SDK v6 → v7**: Anunciado el 25 de junio 2026 (hace 2 semanas). Requiere Node.js 22+ y ESM-only imports. `ToolLoopAgent`, `generateText`, `generateObject` pueden tener cambios.

## Cambios Propuestos

### PR 1: Dependency Audit & Baseline (200 líneas)

**Qué:** Auditar el estado actual de todas las dependencias.

**Acciones:**

1. `bun run security:audit` — vulnerabilidades conocidas
2. `bunx npm-check-updates --deep` — packages desactualizados
3. `madge --circular --ext ts,tsx apps/ packages/` — dependencias circulares
4. Instalar `knip@6.23.0` y correr `knip --dependencies` — dependencias no usadas
5. Identificar dual versioning en bun.lock
6. Generar reporte: `reports/dependency-audit-2026-07.md`

### PR 2: Drizzle ORM 0.45 → 1.0 RC Migration (400 líneas)

**Qué:** Migrar de Drizzle ORM 0.45.2 a 1.0.0-rc.4.

**Impacto confirmado:**

- `db.query.X.findFirst()` / `db.query.X.findMany()` (Relational Queries v1) — **20+ usos**
- Migrar a Relational Queries v2 API
- Verificar cambios en schema definitions, migrations, y drizzle-kit

**Acciones:**

1. Leer [Drizzle 0.x → 1.0 migration guide](https://orm.drizzle.team/docs/latest-releases/drizzle-orm-v1beta2)
2. Actualizar `db.query...findFirst/findMany` a v2 en todos los repositories
3. Verificar schema definitions
4. Correr `bun run db:check` después de la migración
5. Testear queries críticas (fiscales, detracciones, etc.)

**Archivos afectados (confirmado):**

- `packages/persistence/src/repositories/postgres-journal-entry.repository.ts`
- `packages/persistence/src/repositories/postgres-bank-transaction.repository.ts`
- `packages/persistence/src/repositories/postgres-bank-reconciliation.repository.ts`
- Otros repositorios que usen `db.query...`

### PR 3: AI SDK v6 → v7 Migration (300 líneas)

**Qué:** Migrar de AI SDK v6 a v7 (anunciado Jun 25, 2026).

**Breaking changes conocidos:**

- Node.js 22+ requerido
- ESM-only imports
- `ToolLoopAgent`, `generateText`, `generateObject` pueden tener API changes

**Acciones:**

1. Leer [AI SDK v6 → v7 migration guide](https://sdk.vercel.ai/docs)
2. Actualizar `ai` en `apps/api` y `packages/ai` **a la misma versión**
3. Actualizar `@ai-sdk/google` a versión compatible con v7
4. Verificar cada uso:
   - `packages/ai/`: `ToolLoopAgent`, `stepCountIs`, `tool`
   - `apps/api/`: `generateText`, `generateObject`
5. Asegurar compatibilidad con Node.js 22+ (verificar Bun soporte)

### PR 4: Minor Updates & Cleanup (200 líneas)

**Qué:** Aplicar updates menores y limpiar.

**Acciones:**

1. `bun update` — updates menores automáticos
2. Actualizar Biome `^2.5.0` → `^2.5.3`
3. Actualizar Tailwind CSS `^4.1.18` → `^4.3`
4. Verificar Playwright version y actualizar
5. Eliminar dependencias no usadas (knip)
6. Unificar dual versioning restante

### PR 5: golangci-lint Setup (100 líneas)

**Qué:** Configurar golangci-lint v2.12.2 para Go CLI.

**Acciones:**

1. Instalar `golangci-lint@v2.12.2`
2. Crear `apps/cli/.golangci.yml` con linters configurados
3. Integrar en CI

## Criterios de Aceptación

1. `bun run security:audit` → 0 vulnerabilidades críticas/altas
2. Drizzle ORM migrado a 1.0 RC sin errores, todas las queries fiscales pasan
3. AI SDK migrado a v7, todos los agentes y tools funcionan
4. 0 dual versioning en bun.lock
5. 0 dependencias no usadas (knip --dependencies pasa)
6. Playwright tests pasan
7. `bun install --frozen-lockfile` pasa
8. `bun run test` pasa sin regresiones
9. golangci-lint configurado y corriendo en CI
