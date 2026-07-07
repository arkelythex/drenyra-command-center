# Drenyra CLI (`apps/cli`)

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

**Drenyra CLI** — production terminal companion for **Drenyra App** (Go + Charm TUI).

Drenyra App es la aplicación React agente con la UI de producto pulida. Drenyra CLI conecta flujos de terminal al mismo harness vía HTTP: model routing, agentes fiscales, aprobaciones, automation, RPC, y operaciones de command center. El grafo de delegación y los handlers viven en TypeScript (`packages/agents`).

## Quick start

```bash
# From drenyra/
bun run go:drenyra:build:release

./bin/drenyra-go init
./bin/drenyra-go doctor          # needs API on :3000
./bin/drenyra-go tui             # full-screen UI ★ recommended
./bin/drenyra-go run "revisar SIRE del periodo" --auto medium
```

Start the Drenyra App/API backend (single instance):

```bash
cd apps/api && bun src/index.ts
```

## Commands

| Command                                           | Description                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `tui`                                             | Full-screen UI — Glow-style list, k9s status bar, lazygit selection |
| `run`                                             | Execute task — styled panels + spinner                              |
| `exec`                                            | Headless JSON (`--format json` default)                             |
| `serve`                                           | NDJSON RPC on stdin/stdout                                          |
| `spawn`                                           | `POST /spawn` for one agent                                         |
| `doctor`                                          | Config + harness ping                                               |
| `agents tree\|list`                               | Delegation graph / API registry                                     |
| `models list\|route`                              | Per-agent model routing                                             |
| `workflow list\|run`                              | Built-in Drenyra product workflows                                  |
| `work inspect <workItemId>`                       | Inspect one fiscal work item through the shared backend contract    |
| `config show\|path\|validate`                     | Configuration                                                       |
| `memory show\|status\|add\|replace\|remove\|edit` | Hermes-style § entries + config limits                              |
| `history list\|search`                            | Session recall (`~/.drenyra/history.jsonl`)                         |
| `command-audit list`                              | Inspect scoped command capability audit events                      |
| `completion bash\|zsh\|fish`                      | Shell completions                                                   |
| `version`                                         | Build metadata                                                      |

## Flags

- `--no-color` / `NO_COLOR=1` — plain output (CI)
- `--verbose` — stderr logs (`serve`, diagnostics)
- Fiscal: `--ruc`, `--period`, `--org`, `--company`, `--user`
- Run: `--auto low|medium|high`, `--root`, `-f` file
- Work inspect: `--format text|json`

## Design influences

| Tool      | Pattern                         |
| --------- | ------------------------------- |
| **Crush** | Go + Cobra, agent CLI structure |
| **Droid** | `run` / `exec`, autonomy levels |
| **Opper** | YAML `agents:` → model map      |
| **Pi**    | `serve` NDJSON RPC, `exec` JSON |
| **Charm** | Lip Gloss + Bubble Tea TUI      |

TUI palette: WCAG 2.2 AA on `#0E0A08` (tests in `internal/tui/palette_test.go`). Web tokens in `packages/ui` unchanged; terminal uses brighter pairs for readability (Zed/Ghostty 2025–2026 contrast practice).

## RPC example

```bash
echo '{"method":"ping","id":"1"}' | drenyra serve
echo '{"method":"execute","id":"2","params":{"task":"conciliar","autoSpawn":true}}' | drenyra serve
echo '{"method":"command_audit.list","id":"3","params":{"eventType":"CAPABILITY_DENIED"}}' | drenyra serve
```

## Build

```bash
bun run go:drenyra:build          # dev
bun run go:drenyra:build:release  # ldflags version
bun run go:drenyra:test
```

## Workflow ownership

Drenyra/Drenyra product workflows live in Drenyra CLI, not project-local Pi commands. Use `drenyra workflow list` and `drenyra workflow run <workflow-id> [context...]` for built-in workflows. See the migration matrix in [drenyra-cli.md](../../../docs/05-development/drenyra-cli.md#migration-from-project-local-pi-customizations). Pi/Gentleman remains the generic agent harness; Drenyra CLI owns product-facing fiscal, review, architecture, and command-center workflows.

## Docs

- [drenyra-cli.md](../../../docs/05-development/drenyra-cli.md)
- [drenyra-harness-runtime.md](../../../docs/05-development/drenyra-harness-runtime.md)
- [drenyra-memory-architecture.md](../../../docs/05-development/drenyra-memory-architecture.md)
- [engram-project-canonical.md](../../../docs/05-development/engram-project-canonical.md)
- [drenyra-tui-antigravity-audit.md](../../../docs/05-development/drenyra-tui-antigravity-audit.md)
