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
- [ ] `packages/shared/src/validation/ruc.ts:68` (`RUC_WEIGHTS[i]` posiblemente `undefined`): checksum de RUC, es fiscal. Requiere Strict TDD y revisión RDD de riesgo alto.
- [ ] `apps/api/src/features/**`, `packages/persistence/**`, `packages/domain/**`: ~1300 errores en código fiscal y de persistencia. Decidir política: reparar por fases o relajar flags en `tsconfig.check.json`.
- [ ] `packages/infrastructure/src/ai`: lo repara otra sesión local.
- [ ] TS6305 en `shared`: falta compilar `packages/domain` (`typecheck:build:domain-core`); es de orden de build, no de código.

- [ ] `packages/shared/src/__tests__/env.test.ts`: 4 tests de `getDrenyraApiKey` (`ARKELYTHEX_API_KEY` / `ARKALYTHIX_API_KEY`) fallan también sin estos cambios (86/90 pasan). Parecen de un renombre de marca a medias.

## Verificación
- `@drenyra/shared` typecheck: de 10 a 2 errores (`ruc.ts` fiscal y TS6305 de build). Tests de shared: 86/90, igual que antes.

## Hallazgo
`SecureLogger.debug` nunca emite salida, y `CURRENT_LOG_LEVEL` está fijo en `DEBUG` aunque el comentario dice que respeta `LOG_LEVEL`. Activar `debug` hoy lo habilitaría en producción. No lo cambié: decidir primero cómo leer `LOG_LEVEL`.

## Constraints
- No tocar fiscal ni `infrastructure/src/ai` en esta tarea.
