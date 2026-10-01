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

1. ~~Renombrar `packages/fiscal-sdd` → FSD~~ **Hecho** (ver abajo). Pendiente relacionado: el ID de agente `drenyra-sdd-orchestrator` (runtime TS, CLI Go y `docs/10-development/go-ts-contracts.md`) es un contrato compartido; renombrarlo exige un cambio coordinado y migración de datos.
2. **`drenyra-shell`** (antes `drenyra-pi`): alinear su runtime pin con Gentle AI 4.0 y retirar sus rutas SDD/OpenSpec si las trae. Cambio en otro repo; aquí solo hay lectura.
3. ~~Actualizar `drenyra-ai` 0.2.0 → v0.5.0~~ **Hecho** (ver abajo). Pendiente: migrar `apps/api/src/features/missions` a los nombres canónicos de comando (tu sesión local lo está tocando; evitar choque).
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

### Hecho: `fiscal-sdd` → FSD (test-first)
- [x] `packages/fiscal-sdd` → **`packages/fiscal-fsd`** (`@drenyra/fiscal-fsd`), `FiscalSDDRunner/Pipeline` → `FiscalFSDRunner/Pipeline`, `sdd-phases.ts`/`sdd-fiscal-pipeline.ts` → `fsd-*`, skill `drenyra-sdd` → `drenyra-fsd`; consumidores actualizados (`fiscal-query-engine`, `application`, ruta de compliance de la API, CODEOWNERS, skills, docs).
- [x] Modo del almacén de artefactos `"openspec"` → `"files"` (`FileArtifactStore`, `artifactBasePath`); el modo viejo ahora **lanza un error explícito** en vez de caer en memoria sin avisar.
- [x] Se conservan por ser datos/contratos persistidos o compartidos: el prefijo de tópicos de Engram `sdd/{changeId}/…`, la estructura en disco `cambios/{changeId}/{fase}.json` y el ID de agente `drenyra-sdd-orchestrator`.
- Verificación: tests nuevos primero (RED) y luego verde: 100/100 en `fiscal-fsd` (97 + 3); typecheck 1346; los fallos de `drenyra-orchestrator` (15, `runtime/budget.test.ts`) y de la API de compliance (20) son idénticos en un worktree del commit anterior, es decir, preexistentes.

### Hecho: CLI en Go (`apps/cli`) retirada
Reemplazada por `drenyra-shell` (comandos `/drenyra:*` sobre Pi) y la CLI de `drenyra-ai`; la estrategia previa del repo ya decía «CLI → gentle-pi terminal».
- [x] Eliminados `apps/cli` (168 archivos: Go + Bubble Tea TUI y 7 comandos TS) y todo su cableado: job `go` de `ci.yml`, pasos Go de `post-merge-verification.yml` y `contracts-nightly.yml`, entrada de Dependabot, CODEOWNERS, scripts `go:drenyra:*`, targets Go del `Makefile` (apuntaban a una ruta inexistente), `.gitignore`, `CODEX-MAP`, `README`, guías y plantillas de issue.
- [x] `docs/10-development/go-ts-contracts.md` eliminado (contratos Go↔TS ya sin parte Go); ADR-007 marcado **Reemplazado**.
- [x] **Gate reparado:** `docs:verify` estaba en rojo desde antes porque exigía `apps/web/src/routes/product-surfaces.tsx`, una ruta que nunca existió; se retiró ese requisito y el de `apps/cli/MAP.md`. Ahora pasa.
- Efecto en conformidad de recibos (`contracts-nightly`): se pierde la pata Go (`go test ./...` del harness); quedan TS (`mission-domain`) y Python (`data-engine`). El esquema de recibo lo congela `drenyra-ai`.
- Consecuencias abiertas: los campos `sourcePath: "apps/drenyra-cli/…"` de `packages/agent-runtime/src/agents/{registry.ts,data/cli-delegation.ts}` apuntan a un archivo que ya no existe (y que ya tenía ruta vieja); y, sin la CLI, **renombrar el ID `drenyra-sdd-orchestrator` ya solo exige migrar datos y docs**, no coordinar con Go.

### Hecho: `drenyra-ai` 0.2.0 (tarball vendorizado) → 0.5.0 (npm)
- [x] `drenyra-orchestrator`, `mission-protocol` y `mission-domain` (que importaba sin declararlo) dependen ahora de **`drenyra-ai@0.5.0`** del registro (con hash de integridad en `bun.lock`); eliminado `vendored/drenyra-ai-0.2.0.tgz`. Comentarios y matriz de capacidades actualizados (ya no dicen `v0.0.1-prealpha.1`).
- [x] Compatibilidad: tests de `mission-protocol` (62), `mission-domain` (163), `mission-client` (25), API de misiones (93) y `drenyra-orchestrator` (121 + los mismos 15 fallos previos de `runtime/budget`) **idénticos a la línea base**.
- [x] **Typecheck 1346 → 1338:** `mission-domain` exporta los comandos canónicos de 0.5.0 (`CreateMissionCommand`, `ApproveMissionCommand`, `RejectMissionCommand`, `ReconcileMissionCommand`, `ExecuteMissionCommand`, `MissionCommand`) y deja `RunIntentCommand`/`ApproveCommand`/`RejectCommand`/`ReconcileCommand` como **alias deprecados** (la API aún los usa; el comentario del shim decía erróneamente que estaban retirados). Las formas coinciden con los campos que lee `missions.service`.
- [x] **Conexión verificable:** `bun run ecosystem:doctor` ejecuta `capabilities show` y `doctor run` de `drenyra-ai` en un HOME aislado y falla si la versión instalada difiere del pin, algún contrato no está FROZEN o el doctor no está sano. Resultado hoy: 0.5.0, 6 contratos FROZEN, healthy. Probado el caso de deriva (pin 0.4.0 → falla).
- [x] `odd:guard` rechaza tarballs de paquetes commiteados (`*.tgz`): los paquetes del ecosistema salen del registro.

### Hecho: seguridad de dependencias (`bun audit` 45 → 3, todas bajas)
- [x] **45 vulnerabilidades (16 altas) → 3 de severidad baja.** Siguiendo el patrón existente de `overrides` en la raíz: `fast-uri >=4.1.4`, `undici >=8.10.2`, `hono >=4.13.7`, `brace-expansion >=5.0.11`, `adm-zip >=0.6.0`, `ip-address >=10.5.1`, `esbuild >=0.25.0`, `@ai-sdk/provider-utils >=5.0.1`, `@vitest/ui` y `@vitest/coverage-v8` en 4.1.11, y `nodemailer >=10.0.5` (la 9.x también era vulnerable: DoS y **divulgación de credenciales SMTP entre tenants**; `apps/api` usa solo `createTransport`/`sendMail`).
- [x] `vitest` a `^4.1.11` en 17 `package.json` y en los 6 paquetes `workspace-*` que aún fijaban `^3` (parche del `@vitest/mocker`: lectura arbitraria de archivos).
- [x] Verificado **idéntico a la línea base**: shared 96, application 753, fiscal-fsd 100, agent-runtime 558, mission-* (62/163/25), infrastructure 74, workspace-* (35/45/140/94/97/80), API (journal, misiones, compliance), **web 18 archivos / 21 tests fallidos exactamente los mismos**, typecheck 1338, `drizzle-kit check` y 27/27 de aislamiento por tenant contra Postgres.
- **Puerta de CI:** `security:audit` ahora es `bun audit --audit-level=high` (bloquea alta/crítica; hoy 0) y el job `Security Audit` de `quality-gates.yml` corre también `bun run ecosystem:doctor` (Node 22). Antes `bun audit` a secas fallaba con cualquier aviso.
- Quedan 3 avisos bajos: alias interno `@ai-sdk/provider-utils-v7` (→ 5.0.0) dentro de `ai`; no se puede subir con `overrides`, se resolverá al actualizar `ai`.
- [x] **Test intermitente corregido** (`domain/cpe-log`, propiedad de `fast-check`): asumía que toda cadena no vacía era válida, pero el dominio rechaza ticket/hash en blanco (correcto). Corregida la propiedad y fijados los contraejemplos; 0 fallos en 30 ejecuciones (antes ~1 de cada 3).

## Fuera de alcance

- Borrar historial o código de producto; reescribir registros históricos.
- Cambios en `drenyra-ai`, `drenyra-shell`, `drenyra-engram` (otros repos, tareas propias).

## Constraints

- Ningún secreto ni dato de cliente; docs en el mismo PR que el cambio.
