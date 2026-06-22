<!-- Manual navigation map for Drenyra CLI (Go). See CODEX-MAP.md for monorepo root. -->
# DRENYRA-CLI-MAP — Drenyra CLI Navigation

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

## Si solo tenés tres minutos

1. **Ubicación**: `apps/drenyra-cli/` — Go CLI + Bubble Tea TUI.
2. **Comando para desarrollar**: `bun run go:drenyra:build` (o `go build ./...` directo).
3. **Arquitectura**: Cobra commands → Engine → Harness/Brain HTTP clients + TUI app.
4. **Lo que más vas a tocar**: `internal/tui/app/` (TUI screens) y `internal/cmd/` (commands).

## Start here
- **Location:** `apps/drenyra-cli/`
- **Module:** `github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli`
- **Language:** Go 1.26.3
- **Framework:** Cobra (CLI) + Bubble Tea (TUI)
- **Build:** `go build ./...` — static binary, no CGO (SQLite via modernc.org/sqlite)
- **Tests:** `go test ./...` — 31 test files, ~32 tests, 19 packages passing
- **Lines of Go:** 9,842 (80 source files + 31 test files)

## Architecture layers

```
cmd/drenyra/main.go          ← Entry point
    │
    └── internal/cmd/        ← 18 Cobra commands (CLI surface)
          │
          ├── INTERNAL ENGINE
          │   ├── internal/config/        YAML config load/validate (config.yaml)
          │   ├── internal/execution/     Central Engine — ties everything together
          │   ├── internal/harness/       HTTP client → @arkelythex/harness API
          │   ├── internal/brain/         HTTP client → Drenyra Brain API
          │   ├── internal/fiscalwork/    HTTP client → fiscal-work API
          │   ├── internal/modes/         Plan/Build modes
          │   ├── internal/router/        LLM model+provider routing with fallback
          │   └── internal/runctx/        Run context builder
          │
          ├── PERSISTENCE
          │   ├── internal/memory/        Hermes-style flat-file memory (MEMORY.md)
          │   ├── internal/memorystore/   SQLite/FTS5 local DB (drenyra.db)
          │   └── internal/history/       history.jsonl append-log
          │
          ├── TUI (interactive mode)
          │   └── internal/tui/           Base UI primitives (theme, palette, chrome)
          │       └── app/                Bubble Tea application (27 files)
          │
          ├── DOMAIN/UTILITY
          │   ├── internal/delegation/    Agent delegation graph (13 agents)
          │   ├── internal/workflow/      10 built-in workflows
          │   ├── internal/audit/         Fiscal/RUC/period validation
          │   ├── internal/rpc/           NDJSON RPC server
          │   ├── internal/output/        Text/JSON formatting
          │   └── internal/version/       Build info via -ldflags
```

## Where is what — by package

### `cmd/drenyra/` — Entry point
| File | Purpose |
|---|---|
| `main.go` | Single entry; calls `cmd.Execute()` |

### `internal/cmd/` — CLI commands (18 files)
| File | Command | Purpose |
|---|---|---|
| `root.go` | `drenyra` | Root command, global flags (`--no-color`, `--verbose`), `PersistentPreRun` → `tui.Init()` |
| `agents.go` | `agents tree`, `agents list` | Inspect agent delegation graph |
| `completion.go` | `completion` | Shell completion (bash/zsh/fish) |
| `config.go` | `config show`, `config validate` | View/validate configuration |
| `doctor.go` | `doctor` | System check: config, harness, memory, history |
| `exec.go` | `exec` | Headless JSON mode for CI/scripts |
| `history.go` | `history` | List recent runs |
| `init.go` | `init` | Write default config to `~/.drenyra/config.yaml` |
| `memory.go` | `memory *` | CRUD + search local memory |
| `models.go` | `models list` | Show agent→model routing table |
| `run.go` | `run` | Execute task via harness with spinner |
| `serve.go` | `serve` | NDJSON RPC server (stdin/stdout) |
| `shared.go` | (shared flags) | `--org`, `--company`, `--ruc`, `--period` shared fiscal flags |
| `spawn.go` | `spawn` | Spawn individual agent |
| `tui.go` | `tui` | Launch full-screen Bubble Tea TUI |
| `version.go` | `version` | Show version/build info |
| `workflow.go` | `workflow list`, `workflow run` | Workflow management |
| `workflow_catalog.go` | (shared) | Re-exports workflow catalog |
| `work.go` | `work inspect` | Inspect fiscal work item |

### `internal/config/` — Configuration (no tests)
| File | Purpose | Key exports |
|---|---|---|
| `config.go` | Main Config struct, `Default()`, `Load()`, `WriteGlobal()` | `Config`, `AppearanceConfig`, `PaletteConfig`, `HarnessConfig`, `MemoryConfig`, `FiscalDefaults` |
| `paths.go` | Path resolution | `DrenyraDir()`, `GlobalPath()`, `Paths()`, `TUIPaths()` |
| `tui.go` | TUI preferences (theme, default_mode, diff, etc.) | `TUIConfig`, `LoadTUI()`, `DefaultTUI()` |
| `validate.go` | Config validation | `Config.Validate()` — RUC, period, permissions |

### `internal/execution/` — Central engine
| File | Purpose | Key exports |
|---|---|---|
| `engine.go` | Orchestrates config + memory + modes + router + harness | `Engine`, `NewEngine()`, `ExecuteInput`, `Client`/`BrainClient` interfaces, `Recorder` |

### `internal/harness/` — Harness API client (no tests)
| File | Purpose |
|---|---|
| `client.go` | `ListAgents()`, `Execute()`, `Spawn()`, `Ping()` |
| `types.go` | `APIResponse`, `ExecuteRequest/Response`, `RunNode` |

### `internal/brain/` — Drenyra Brain API client
| File | Purpose |
|---|---|
| `client.go` | `NewClient()`, `CreateThread()`, `StartTurn()` |
| `types.go` | `FiscalContext`, `Thread`, `Turn` |

### `internal/fiscalwork/` — Fiscal work API client
| File | Purpose |
|---|---|
| `client.go` | `Inspect()` with fiscal context headers |
| `types.go` | `InspectCapability`, `FiscalContext`, `FiscalCase`, `FiscalScope` |

### `internal/router/` — LLM routing
| File | Purpose |
|---|---|
| `router.go` | `Resolve(agentID)` → model+provider with fallback chain |

### `internal/modes/` — Plan/Build
| File | Purpose |
|---|---|
| `modes.go` | `Mode` type (`Plan`/`Build`), `Normalize()`, `Label()`, `Toggle()`, `ApplyToTask()` |

### `internal/runctx/` — Run context (no tests)
| File | Purpose |
|---|---|
| `runctx.go` | `BuildMetadata()`, `RecordRun()`, `ExecuteRequest()` with memory snapshot |

### `internal/memory/` — Hermes-style memory
| File | Purpose | Key exports |
|---|---|---|
| `memory.go` | `Snapshot` struct, capacity constants | `Snapshot`, `MaxMemoryChars`, `MaxUserChars` |
| `scan.go` | Security scan: injection/unicode detection | `ScanForInjection()` |
| `session.go` | SQLite session integration | `RecordRun()`, `LoadSnapshot()`, `BuildMetadata()`, `LocalDBStatus/Search` |
| `settings.go` | Memory settings from config | `Settings` (char limits, provider) |
| `store.go` | Thread-safe memory store | `Store`, `LoadSnapshot()`, `Mutate()` |
| `targets.go` | Target parsing | `memory\|user`, `MutateKind` |
| `templates.go` | Default seed entries | MEMORY.md, USER.md defaults |
| `warn.go` | Capacity warning | `NeedsConsolidation()` at 80% |

### `internal/memorystore/` — SQLite/FTS5 local
| File | Purpose |
|---|---|
| `store.go` | `Open()`, `OpenDefault()`, `Init()`, `Status()`, `Search()`, `SaveObservation()`, `RecordSession()` |

### `internal/history/` — Execution history
| File | Purpose |
|---|---|
| `history.go` | `Append()`, `Recent()` — history.jsonl persistence |
| `search.go` | `Search()`, `Last()` — case-insensitive search |

### `internal/tui/` — Base UI primitives
| File | Purpose | Key exports |
|---|---|---|
| `palette.go` | Color palette (16 colors, WCAG AA+) | `Palette`, `DefaultPalette()`, `Palette.Apply()` |
| `theme.go` | Theme singleton (50+ lipgloss styles) | `Theme`, `Init()`, `T()` |
| `chrome.go` | Layout chrome | `RenderHeader()`, `RenderKeyBar()`, `ContentFrame()` |
| `components.go` | Reusable UI components | `Banner()`, `Panel()`, `Check()`, `KV()`, `Table()`, `StatusBadge()` |
| `format.go` | Data formatting | `FormatAgentStack()`, `FormatMemoryView()` |
| `render.go` | CLI output renderers | `RenderDoctor()`, `RenderAgentsList()`, `RenderModelsList()`, `RenderExecute()` |
| `tree.go` | Delegation tree | `PrintAgentStack()`, `PrintRunTree()` |
| `errors.go` | Error rendering | `RenderError()` with contextual hints |
| `contrast.go` | WCAG contrast utilities | `contrastRatio()`, `relativeLuminance()`, `hexToRGB()` |
| `spinner.go` | Async spinner model | Bubble Tea spinner with async execution |

### `internal/tui/app/` — Bubble Tea full-screen app
| File | Screen/Area | Purpose |
|---|---|---|
| `run.go` | Entry | `RunInteractive()` — creates `tea.Program` |
| `model.go` | Core | `model` struct, `Init()`, `Update()`, 11-screen dispatcher |
| `view.go` | Rendering | `View()` — composes header + body + status + prompt + footer |
| `layout.go` | Layout | `contextPanelWidth()`, `breadcrumbFor()`, `bodySize()`, `keyBarFor()` |
| `contextpanel.go` | Panel | Right split-panel: fiscal context, agents, workflows, recent |
| `statusbar.go` | Status | Bottom bar: connection dot, provider badge, mode, auto-level, memory |
| `sidebar.go` | **(deleted)** | Replaced by contextpanel.go in TUI v2 |
| `approval.go` | Approval | Fiscal approval gate (y/n) |
| `command_palette.go` | CmdPalette | Ctrl+P fuzzy command search overlay |
| `memory_browser.go` | MemBrowser | /memory screen: FTS search + results |
| `history_view.go` | History | Session history recall (older/newer) |
| `help.go` | Help | Contextual help text |
| `prompt.go` | Slash cmds | `/doctor`, `/agents`, `/models` parsing |
| `harness.go` | Async | `executeTaskCmd()`, `doctorChecksCmd()` |
| `items.go` | Data | `menuEntry`, `autoEntry` types |
| `delegate.go` | List | `menuDelegate`, `autoDelegate` for bubbled list |
| `mode.go` | Mode | Plan/Build adaptation for TUI |
| `welcome.go` | Welcome | Home screen welcome line |
| `messages.go` | Messages | Bubble Tea message types |
| `key_regression_test.go` | Tests | Q-key regression |

### `internal/delegation/` — Agent graph
| File | Purpose |
|---|---|
| `graph.go` | `Agents` map with 13 predefined agents (orchestrator, sunat, ledger, hr, swarm, etc.) |

### `internal/workflow/` — Built-in workflows
| File | Purpose |
|---|---|
| `catalog.go` | 10 workflows: `architecture-check`, `bugfix-tdd`, `pre-pr`, `code-review`, `add-feature`, `scout-refactor`, `fiscal-diag`, `fiscal-impact`, `session-archive`, `session-summary` |

### `internal/audit/` — Fiscal validation
| File | Purpose |
|---|---|
| `fiscal.go` | `FiscalFromConfig()`, RUC (11-digit) + period validation |

### `internal/rpc/` — NDJSON RPC server
| File | Purpose |
|---|---|
| `server.go` | `Handler` interface, `Serve(io.Reader, io.Writer, Handler)` |

### `internal/output/` — Formatting (no tests)
| File | Purpose |
|---|---|
| `format.go` | JSON/Text output: `WriteExecute()`, `WriteSpawn()`, `WriteFiscalWorkInspect()` |

### `internal/version/` — Build info (no tests)
| File | Purpose |
|---|---|
| `version.go` | `Version`, `Commit`, `Date` (via -ldflags), `Short()`, `Long()` |

## Key data dirs (runtime)
| Path | Contents |
|---|---|
| `~/.drenyra/config.yaml` | CLI configuration |
| `~/.drenyra/tui.json` | TUI appearance preferences |
| `~/.drenyra/drenyra.db` | SQLite/FTS5 local memory store |
| `~/.drenyra/history.jsonl` | Execution history log |
| `~/.drenyra/memories/` | Hermes-style flat-file memory (MEMORY.md, USER.md) |

## Fast search recipes
```bash
# Find TUI view files (the most-changed area)
fd '.go$' internal/tui/ -tf

# Find specific screen handler
rg 'screenMenu|screenResult|screenRunning' internal/tui/app/

# Find palette/theme overrides
rg 'Palette|AppearanceConfig' internal/config/config.go

# Find color references in TUI
rg '#[0-9a-fA-F]{6}' internal/tui/palette.go

# Find config struct definitions
rg 'type.*Config struct|type.*Config ' internal/config/

# Find API client calls
rg 'harness\.Client|brain\.Client|fiscalwork\.Client' internal/

# Find test files
fd '_test\.go$' -tf

# Find Bubble Tea message types
rg 'type.*Msg|type.*msg' internal/tui/app/messages.go

# Find all screen renders
rg 'case screen' internal/tui/app/model.go
```

## Common tasks → exact paths
| Task | Start path |
|---|---|
| Add/edit Cobra command | `internal/cmd/<name>.go` |
| Change config structure | `internal/config/config.go` |
| Change TUI palette/colors | `internal/tui/palette.go` |
| Add TUI screen/view | `internal/tui/app/<name>.go` |
| Add screen handler + render | `internal/tui/app/model.go` (case), `view.go` (render dispatch) |
| Change status bar | `internal/tui/app/statusbar.go` |
| Change context panel | `internal/tui/app/contextpanel.go` |
| Change layout/sizing | `internal/tui/app/layout.go` |
| Add/edit workflow | `internal/workflow/catalog.go` |
| Add/edit agent | `internal/delegation/graph.go` |
| Change model routing | `internal/router/router.go` |
| Change memory persistence | `internal/memory/` or `internal/memorystore/` |
| Change execution engine | `internal/execution/engine.go` |
| Change CLI output format | `internal/output/format.go` |
| Add API client | `internal/<service>/client.go` + `types.go` |

## Dependencies
| Library | Version | Purpose |
|---|---|---|
| `charmbracelet/bubbletea` | v1.2.4 | TUI framework (event loop, model lifecycle) |
| `charmbracelet/bubbles` | v0.20.0 | TUI components (list, textinput, viewport, spinner) |
| `charmbracelet/lipgloss` | v1.0.0 | Terminal styling |
| `spf13/cobra` | v1.9.1 | CLI framework |
| `sahilm/fuzzy` | v0.1.1 | Fuzzy search (command palette) |
| `modernc.org/sqlite` | v1.50.1 | Pure-Go SQLite (no CGO) |
| `google/uuid` | v1.6.0 | UUID generation |
| `gopkg.in/yaml.v3` | v3.0.1 | YAML parsing |

## CI gates (when editing Go CLI)
```bash
go build ./...                          # Build
go vet ./...                            # Static analysis
go test ./...                           # All tests
gofmt -d .                              # Check formatting (diff)
```
