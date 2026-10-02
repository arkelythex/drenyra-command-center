# Typecheck baseline and phased repair

**Última actualización**: 2026-10-02

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

## Plan por fases (propuesta — estado ODD: fase 0 hecha; fases 1–4 autorizadas)

**Por qué ahora:** PR #248 activa los jobs `Node — web/api typecheck` y `Domain — typecheck + test` (filtrados por rutas, así que en `main` se «omitían»). Los tres fallan **igual en `main`**; la rama tiene menos errores (web 688→681, domain 377→373, api/raíz 1353→1334). Ningún cambio de comportamiento se esconde aquí: es deuda de configuración estricta.

**Medición (2026-10-02, raíz: 1334):**

| Código | Errores | Qué es |
|--------|---------|--------|
| TS2379 + TS2375 | 524 | `exactOptionalPropertyTypes`: se pasa `T \| undefined` a una propiedad opcional `T` |
| TS18048 + TS2532 | 340 | `noUncheckedIndexedAccess`: acceso a índice posiblemente `undefined` |
| TS2345 + TS2322 | 190 | asignaciones/argumentos incompatibles |
| TS6133 + TS6196 | 89 | variables/tipos sin usar |
| TS2307 + TS2308 + TS2339 | 71 | módulos/exports inexistentes: **defectos reales** |

| Dónde | Errores |
|-------|---------|
| `apps/api` | 787 |
| `packages/domain` | 132 |
| `packages/persistence` | 103 |
| `packages/agent-runtime` | 98 |
| `packages/infrastructure` | 80 |
| `packages/application` | 57 |
| `packages/ai` | 49 |
| resto | 28 |

**Fases (cada una = un PR, un paquete o un código de error a la vez):**

0. ✅ **Hecha — Ratchet en CI:** un script que compara el conteo de errores por paquete con un archivo de línea base versionado, falla si **sube** y exige actualizarlo si **baja**. Deja el CI verde hoy sin ocultar deuda y evita que crezca. Implementado con TDD (`scripts/ci/typecheck-ratchet.ts`, 18 tests, mutantes de `>`, bucket nuevo y `canUpdate` muertos); línea base en `.ci/typecheck-baseline.json` (web 681, api 1334, domain 373, por archivo+código). Uso: `bun run typecheck:ratchet <web|api|domain> [--update]`; los tres jobs de `ci.yml` lo ejecutan en lugar de `typecheck`. Probado de extremo a extremo: un error nuevo falla (exit 1), quitarlo vuelve a verde.
1. ◐ **En curso (PR aparte `claude/typecheck-phase1`):** primera tanda hecha = imports sin usar (16 archivos; domain 373→360, api 1334→1294). **Defectos reales (PR aparte `claude/typecheck-real-defects`): hechos** — `packages/ai` importaba un `../logger` inexistente en 29 módulos (12 archivos de test no cargaban: 268→411 tests); 2 archivos muertos con imports a cosas inexistentes borrados; el mayor de `reports` consultaba columnas `customerName`/`supplierName` que no existen (ahora se une con `business_partners.legal_name`); `CloseExecutionResult` declara `progress`/`error` opcionales (MissionRuntime ya los leía); `PiAgentRuntimeAdapter` carga el SDK de forma inyectable con un error claro si falta. **Falsos positivos descartados:** `feos.controller.ts` (`Workspace.start/verify/…`): en ejecución `Workspace` sí tiene esos métodos; los errores vienen de cómo tsc resuelve `@drenyra/domain` → fase 4. Pendiente de esta fase: locales/parámetros sin usar (se dejan fuera los de firma de recibos, XML fiscal y cierre mensual: pueden ser huecos de lógica y piden test-first) y los defectos reales (`../logger` inexistente en `packages/ai`, `Workspace.start/verify/…` en `feos.controller.ts`, `ledgerEntries` en `ledger-query.facade.ts`, `@earendil-works/pi-coding-agent`). Original: TS6133/TS6196 (código sin usar) y los TS2307/TS2308/TS2339 (módulos o exports que no existen: defectos reales, se corrigen o se eliminan con su referencia).
2. **`noUncheckedIndexedAccess`** (≈340): guardas explícitas. En `domain`/`persistence`/RUC es fiscal → **test-first, review de riesgo alto**.
3. **`exactOptionalPropertyTypes`** (≈524): añadir `| undefined` a los tipos o no asignar la clave cuando falta. Mecánico pero ancho; en `persistence` y `domain` fijar el comportamiento con snapshots antes.
4. **Configuración de `domain`**: que `tsc --noEmit` no arrastre `agent-runtime`/`fiscal-agent-domain` a su programa (hoy 373 vs 132 en la raíz; TS6059/TS6307 `rootDir`/`composite`).
5. **Retirar el ratchet** cuando el conteo llegue a 0 y dejar el typecheck estricto como gate.

**Alternativa a evaluar (política, no técnica):** relajar `exactOptionalPropertyTypes` en `tsconfig.check.json`. Elimina ~524 errores al instante, pero pierde una garantía que hoy el repo eligió. No la recomiendo sin decisión explícita.

**Regla operativa:** al arreglar errores, ejecutar `bun run typecheck:ratchet <job> --update` en el mismo PR para fijar la mejora; nunca editar la línea base a mano para subirla.

## Verificación
- `@drenyra/shared` typecheck: de 10 a 1 error (solo TS6305 de build). Tests de shared: 90/90. RUC: 33 tests; un mutante en los pesos (swap de dos posiciones o un peso cambiado) hace fallar 12 y 8 tests respectivamente.

## Hallazgo
`SecureLogger.debug` nunca emite salida, y `CURRENT_LOG_LEVEL` está fijo en `DEBUG` aunque el comentario dice que respeta `LOG_LEVEL`. Activar `debug` hoy lo habilitaría en producción. No lo cambié: decidir primero cómo leer `LOG_LEVEL`.

## Constraints
- No tocar fiscal ni `infrastructure/src/ai` en esta tarea.
