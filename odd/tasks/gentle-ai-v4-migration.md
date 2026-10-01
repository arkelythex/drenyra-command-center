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
- [x] Eliminadas las configs SDD: `openspec/config.yaml` y `packages/pi/openspec/config.yaml`.
- [x] `openspec/` marcado como **archivo histórico** de solo lectura (`openspec/README.md`); `master-index.md` actualizado.
- [x] `.superpowers/` retirado; su único documento pasó a `odd/archive/phase5-audit-2026-07-06.md`.
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

1. **`openspec/changes/` (148 archivos):** ¿se conserva como archivo (hoy) o se borra del árbol? El historial de git los preserva igual. Algunos documentos aún los citan.
2. **Renombrar `packages/fiscal-sdd` → FSD** (paquete, imports, tests, skill `drenyra-sdd`): tarea crítica aparte, con test-first.
3. **`drenyra-shell`** (antes `drenyra-pi`): alinear su runtime pin con Gentle AI 4.0 y retirar sus rutas SDD/OpenSpec si las trae. Cambio en otro repo; aquí solo hay lectura.
4. **`vendored/drenyra-ai-0.2.0.tgz`** vs `drenyra-ai` v0.5.0: actualización crítica y separada.
5. **`.gga` (`PROVIDER="codex"`):** confirmar que sigue siendo el proveedor de review deseado con el review nativo de v4.

## Fuera de alcance

- Borrar historial o código de producto; reescribir registros históricos.
- Cambios en `drenyra-ai`, `drenyra-shell`, `drenyra-engram` (otros repos, tareas propias).

## Constraints

- Ningún secreto ni dato de cliente; docs en el mismo PR que el cambio.
