# Drenyra CLI (`apps/cli`)

**Última actualización**: 2026-06-20 · Filosofía: *Gentleman Philosophy* — cognitive load reduction, warm teaching, progressive disclosure.

**Drenyra CLI** — terminal companion for **developers, operators, and integrators** (Go + Charm TUI).

**Drenyra App** (web/React) is the product UI: the interface of the professional accountant. The Drenyra CLI connects terminal workflows to the same harness over HTTP — model routing, fiscal agents, approvals, automation, RPC, and command-center operations. The delegation graph and handlers live in TypeScript (`packages/agents`).

> [!IMPORTANT]
> **Role separation (frontier, ADR-010):** the accountant works in **Drenyra App** and asks for outcomes — never a terminal. The CLI is a **developer/operator/early-adopter tool**: diagnosis, integration, automation, and RPC. Agents propose; the deterministic Core and professional approval decide. The golden rule: the professional should never have to learn to operate an agent orchestration — they request an accounting result and receive reviewable candidates, evidence, explicit decisions, and verifiable receipts.

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

Drenyra/Drenyra product workflows live in Drenyra CLI, not project-local Pi commands. Use `drenyra workflow list` and `drenyra workflow run <workflow-id> [context...]` for built-in workflows. See the migration matrix in `docs/10-development/drenyra-cli.md` (pending publication). Pi/Gentleman remains the generic agent harness; Drenyra CLI owns product-facing fiscal, review, architecture, and command-center workflows.

## Docs

- [engram-project-canonical.md](../../docs/10-development/engram-project-canonical.md)
