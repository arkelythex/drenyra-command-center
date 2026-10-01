# Typecheck baseline and phased repair

**Última actualización**: 2026-10-01

## Objective
Medir y clasificar por qué `bun run typecheck` está rojo y reparar solo lo no fiscal, sin tocar el código que otra sesión ya está corrigiendo.

## Baseline (TypeScript 7.0.2, `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`)
- `bun run typecheck` (tsconfig.check.json): **1363 errores**; `@drenyra/api`: igual; `@drenyra/domain`: 377; `@drenyra/shared`: 10 (antes de este cambio).
- Por código: TS2379 (335), TS18048 (213), TS2375 (189), TS2532 (133), TS2345 (99), TS2322 (91), TS6133 (79).
- ~900 son consecuencia directa de `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`, concentrados en `apps/api/src/features` (770), `packages/persistence/src/repositories` (101) y `packages/domain/src/feos` (60).
- `@drenyra/domain`: 98 TS6307 + 98 TS6059 son de configuración (project references / `rootDir`), no errores de código.
- Módulos o exports inexistentes (`../logger`, `DrizzleClient`, comandos de `@drenyra/mission-domain`, `@earendil-works/pi-coding-agent`, `next/navigation`): pocos, pero son defectos reales.

## Scope (hecho)
- [x] `packages/shared/src/kernel/errors.ts`: campos opcionales aceptan `| undefined` (sin cambio de comportamiento).
- [x] `packages/shared/src/config/rate-limit.ts`: la limpieza accede a un método `deleteExpired` en vez de al campo privado `store`; acceso seguro al primer valor de `x-forwarded-for`.
- [x] `packages/shared/src/secure-logger.ts`: se eliminan variables muertas en `debug` (mismo comportamiento: no emite nada).

## Fuera de alcance (decisión pendiente)
- [x] `packages/shared/src/validation/ruc.ts:68` (`RUC_WEIGHTS[i]` posiblemente `undefined`): checksum de RUC, es fiscal. Requiere Strict TDD y revisión RDD de riesgo alto.
- [ ] `apps/api/src/features/**`, `packages/persistence/**`, `packages/domain/**`: ~1300 errores en código fiscal y de persistencia. Decidir política: reparar por fases o relajar flags en `tsconfig.check.json`.
- [ ] `packages/infrastructure/src/ai`: lo repara otra sesión local.
- [ ] TS6305 en `shared`: falta compilar `packages/domain` (`typecheck:build:domain-core`); es de orden de build, no de código.

- [x] Los 4 tests de `getDrenyraApiKey` que fallaban no eran un renombre a medias: Vitest resolvía `.js` compilados y viejos que están trackeados junto a los `.ts`. Se corrigió con `resolve.extensions` en `packages/shared/vitest.config.ts`; ahora 90/90 (RUC: 33).
- [x] Se aplicó la preferencia `.ts` en `application`, `persistence` e `infrastructure`: resultados idénticos antes y después (application 739/741, persistence 61 pasan y 141 fallan por falta de Postgres, infrastructure 74/74 con 10 archivos que no cargan). Sin efecto medible hoy, pero evita el mismo problema que ocurrió en `shared`.
- [ ] Fallas reales en `application`: ver `odd/tasks/tenant-scope-journal-update.md`.
- [ ] **Artefactos compilados trackeados en `src/`**: 290 `.js`/`.d.ts` (shared 49, infrastructure 118, application 72, persistence 48, web 3). Pueden hacer que los tests de esos paquetes ejecuten código viejo. Verificado en `shared` (un mutante en `ruc.ts` pasaba los tests). Falta revisar los otros paquetes y decidir si se eliminan del índice y se agregan a `.gitignore`.
- [x] `.husky/pre-push` usaba `set -o pipefail` y `[[ ]]` con `sh`; falla en dash. Cambio propuesto: `#!/usr/bin/env sh`, `set -eu` y `[ ]`. Aplicado y probado con dash.

## Verificación
- `@drenyra/shared` typecheck: de 10 a 1 error (solo TS6305 de build). Tests de shared: 90/90. RUC: 33 tests; un mutante en los pesos (swap de dos posiciones o un peso cambiado) hace fallar 12 y 8 tests respectivamente.

## Hallazgo
`SecureLogger.debug` nunca emite salida, y `CURRENT_LOG_LEVEL` está fijo en `DEBUG` aunque el comentario dice que respeta `LOG_LEVEL`. Activar `debug` hoy lo habilitaría en producción. No lo cambié: decidir primero cómo leer `LOG_LEVEL`.

## Constraints
- No tocar fiscal ni `infrastructure/src/ai` en esta tarea.
