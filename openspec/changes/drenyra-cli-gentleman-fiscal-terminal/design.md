# Design — Drenyra CLI Gentleman Fiscal Terminal

## Terminal architecture model

```text
apps/cli
├── Commands
│   ├── read-only inspection
│   ├── workflow launchers
│   ├── config/doctor/history
│   └── headless exec JSON mode
├── TUI
│   ├── fiscal context bar
│   ├── workflow status
│   ├── agent pane
│   ├── evidence panel
│   └── approval prompts
├── Execution engine
│   ├── fiscal scope validation
│   ├── run context
│   ├── model/router selection
│   └── harness/brain/fiscalwork clients
└── Local continuity
    ├── history
    ├── memory snapshot
    ├── session state
    └── safe evidence references
```

## Design decisions

### Shell before spectacle

The CLI must remain useful without the TUI. Every fiscal workflow should expose stable command and JSON behavior before terminal UI polish.

### TUI as fiscal cockpit

The TUI should surface context, evidence, and approvals. It should not hide command semantics or make operations impossible to automate.

### Agent pane as supervised operator

The agent pane can explain errors, propose next steps, and prepare actions. It must show evidence and request approval for risky mutations.

### Local state is bounded

Local memory/history should store operational context and references, not secrets or raw customer-sensitive data.

## Relationship to existing plans

| Existing plan                 | Role                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `drenyra-s5-go-cli-alignment` | Aligns Go contracts, memory, delegation, and workflows with platform semantics. |
| `drenyra-p1-fiscal-terminal`  | Implements the fiscal terminal experience.                                      |
| This plan                     | Defines product philosophy and safety constraints that P1/S5 should obey.       |

## Suggested implementation slices

1. Docs and MAP alignment.
2. Command taxonomy and read-only/mutating policy.
3. Fiscal context validation improvements.
4. TUI context/evidence/approval patterns.
5. Agent pane and corrective suggestions.
6. Web/CLI traceability and reproduction notes.

## Test strategy

- Go unit tests for command validation and context enforcement.
- Golden tests for CLI output where stable.
- TUI model tests for state transitions where practical.
- Integration tests for JSON output contracts when workflows are exposed to CI.

## Risks

- Overbuilding TUI before command semantics are stable.
- Storing too much sensitive local context.
- Letting agent convenience bypass approval gates.
- Diverging from web semantics and creating two fiscal languages.
