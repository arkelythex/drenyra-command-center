# Migración al ecosistema Gentle AI v4 / Gentle Shell 4.0

**Última actualización**: 2026-10-01
**Nivel ODD**: grande (toca CI, `AGENTS.md`/`CLAUDE.md`, plantillas y archivo histórico).
**Estado ODD**: lado repositorio **Ready**; pasos locales y decisiones en **Needs your decision**.

## Objetivo

Dejar Drenyra alineado con **Gentle AI v4.0.0** y **Gentle Shell 4.0** (`gentle-pi` 4.0.0): ODD como único flujo, SDD/OpenSpec retirados, review (RDD) y test-first independientes, y sin legado de proceso en el repo.

## Fuentes verificadas (2026-10-01)

- [Gentle AI releases](https://github.com/Gentleman-Programming/gentle-ai/releases): «SDD and OpenSpec are retired and ODD is the single development route»; RDD y test-first independientes; test-first se instala por defecto (sin opción «Strict TDD» aparte); OpenCode V2; Pi usa MCP nativo y se retira `pi-mcp-adapter`; suite Windows en verde; módulo Go en `/v4`.
- [Gentle Shell (gentle-pi) releases](https://github.com/Gentleman-Programming/gentle-pi/releases): `gentle-pi` v4.0.0, `npm i -g gentle-pi`, comando `gentle-shell`, runtime Gentle AI 4.0.0 empaquetado, rutas SDD/OpenSpec retiradas, `repository_root` para subagentes en otros repos (desde 3.7.0).
- **Corrección al texto recibido:** el comando de Go es `go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@v4.0.0` (el original llegó cortado y con `http://`).

## Alcance

### Hecho en el repo
- [x] Eliminados los workflows `auto-sdd.yml`, `sdd-auto-implement.yml` (generaban y auto-implementaban propuestas SDD con IA) y `cursor-gentle-ai-sync.yml` (re-vendoreaba `sdd-orchestrator`; `.cursor/` ni existe).
- [x] Eliminadas las configs SDD (`openspec/config.yaml`, `packages/pi/openspec/config.yaml`).
- [x] **`openspec/` completo eliminado (410 archivos, 5.5 MB).** El plan H02 que seguía vivo pasó a `odd/tasks/h02-tenant-isolation.md`; los enlaces de la documentación son permalinks al commit `d428534` (`git show d428534:openspec/<ruta>`). También `apps/web/docs/sdd/` (5 archivos).
- [x] `.superpowers/` retirado; su único documento pasó a `odd/archive/phase5-audit-2026-07-06.md`.
- [x] **Limpieza de peso:** 287 `.js`/`.d.ts` compilados trackeados en `src/` de `shared`, `application`, `infrastructure` y `persistence` (sombreaban a los `.ts` en tests; incluye 4 restos de un vertical electoral eliminado), el video `products/kuse/docs/cowoker-demo.mp4` (27.5 MB), `geist-1.7.2.tgz` y `fontsource-inter-5.2.8.tgz` (8.7 MB, sin referencias) y la caché `apps/cli/.pi-lens/` (ya ignorada). Resultados de tests y typecheck idénticos a la línea base.
- [x] **Guardarraíl `odd:guard`** (`scripts/ci/odd-guard.sh`, en `docs:verify` y en el job `ODD guard` de CI): si reaparece `openspec/`, un workflow SDD o build compilado junto a los `.ts`, falla con un mensaje que lista los caminos para seguir (equivalente Drenyra del «nada queda trabado» de v4).
- [x] `packages/fiscal-sdd/vitest.config.ts` tenía un error de sintaxis (llave sobrante): sus tests no arrancaban. Corregido; 97/97 pasan.
- [x] Plantillas de issue/PR y `hooks-config` ya no mencionan SDD/OpenSpec.
- [x] `CLAUDE.md`, `AGENTS.md` y `docs/10-development/odd-workflow.md` reescritos para v4: ODD escala solo (simple/incierto/grande/crítico), RDD y test-first independientes, rechazo claro si algo llama a SDD, y guía de actualización con comandos verificados.

### Lo que NO es legado (no se tocó)
- `packages/fiscal-sdd` y la skill `drenyra-sdd`: son **FSD**, producto fiscal (captura → clasificación → conciliación → cierre) que consume `apps/api/src/features/compliance/routes/pipeline.route.ts`. Solo su nombre «SDD» es heredado.
- Registros históricos en `docs/12-security`, `docs/14-design` («SDD aplicado», `cap-workbench-00`): se conservan como historia fechada.

## Pasos locales (solo tú; no se pueden ejecutar desde el repo)

```bash
brew upgrade gentle-ai && gentle-ai sync
# si instalaste con Go (una sola vez):
go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@v4.0.0 && gentle-ai sync
npm i -g gentle-pi
```

Verifica: `gentle-ai --version` (4.x), `gentle-ai sync` sin avisos, doctor de Engram (ver `docs/10-development/engram-guide.md`), `bun run typecheck` sin cambios, y que Pi ya no liste `pi-mcp-adapter`.

## Decisiones pendientes

1. **Renombrar `packages/fiscal-sdd` → FSD** (paquete, imports, tests, skill `drenyra-sdd`): tarea crítica aparte, con test-first.
2. **`drenyra-shell`** (antes `drenyra-pi`): alinear su runtime pin con Gentle AI 4.0 y retirar sus rutas SDD/OpenSpec si las trae. Cambio en otro repo; aquí solo hay lectura.
3. **`vendored/drenyra-ai-0.2.0.tgz`** vs `drenyra-ai` v0.5.0: actualización crítica y separada.
4. **`.gga` (`PROVIDER="codex"`):** confirmar que sigue siendo el proveedor de review deseado con el review nativo de v4.

5. **Crear los repos de `products/`** (ver abajo): el código ya salió de este repo; falta que publiques cada historial en su propio repositorio.
6. **Reemplazo del runtime por el SDK de Pi:** `packages/agent-runtime` (ex `packages/pi`) es el runtime de agentes que usa la API (`Agent`, `DomainAgent`, `ApprovalGateEngine`, `SessionManager`, `queueManager`, estrategias, MCP; ~40 importadores). **`drenyra-shell` no ofrece ninguno de esos 19 símbolos** (verificado por búsqueda). El plan `docs/14-design/pi-migration-cleanup-plan.md` lo sustituye por adaptadores del SDK de Pi **solo cuando el shadow-run confirme paridad**; hasta entonces no se borra.

### Hecho: `packages/pi` → `packages/agent-runtime`
- [x] Retirado el harness duplicado de `drenyra-shell`: `prompts/` (11/11 idénticos), `skills/`, `contracts/`, `extensions/`, `themes/` y `scripts/` (incluido el `postinstall` que instalaba la extensión en Pi); manifiesto sin `pi`, `postinstall` ni `hooks:install`.
- [x] Renombrado el paquete a **`@drenyra/agent-runtime`** (61 archivos, `tsconfig`, `bun.lock`, script `drenyra:serve`). Resultados idénticos a la línea base: runtime 558/558, tests de la API que lo usan sin cambios, typecheck 1349, `bun install --frozen-lockfile` correcto.
- El renombre destapó deuda de lint latente en 32 archivos: se corrigió lo mecánico y se inventarió el resto en `odd/tasks/agent-runtime-lint-debt.md` (sin saltarse el hook).
- Pendiente: `apps/cli` (Go/TS) y `apps/web` aún usan «pi» en comandos y textos de cara al usuario (`drenyra pi`), y `docs/diagrams/drenyra-command-center.architecture.html` es un artefacto generado con la ruta vieja; se regenera con Archify.

### Hecho: `products/` retirado (política de alcance)
- [x] Eliminados `products/andino` (drones, 170 archivos), `products/estado` (civic tech, 184), `products/kuse` (app Tauri de cowork, 129) y `products/senzar` (trazabilidad agro, 24), más el workflow `andino-studio.yml`: 31 MB y 509 archivos. Ningún código contable los importaba (verificado: sin workspaces, `turbo`, `knip` ni imports); el único acoplamiento era ese workflow.
- [x] El guardarraíl `odd:guard` rechaza ahora un `products/` nuevo con los pasos para extraerlo.
- **Extraer con historial** (probado con `senzar`: 24 archivos, historial intacto). Desde un clon de este repo:

```bash
git subtree split -P products/<andino|estado|kuse|senzar> -b extract/<nombre> 91e116b
git push git@github.com:arkelythex/<nuevo-repo>.git extract/<nombre>:main
```

  `91e116b` es el último commit que contiene `products/`. Yo no creé los repos: crear repositorios nuevos en tu cuenta queda fuera del alcance de esta sesión.

## Fuera de alcance

- Borrar historial o código de producto; reescribir registros históricos.
- Cambios en `drenyra-ai`, `drenyra-shell`, `drenyra-engram` (otros repos, tareas propias).

## Constraints

- Ningún secreto ni dato de cliente; docs en el mismo PR que el cambio.
