# Design — Drenyra North Star Philosophy

## Design decision

Create a parent OpenSpec change that defines product philosophy as a delivery contract, then split implementation into child plans for web, CLI, and documentation alignment.

This prevents a vague manifesto from becoming disconnected prose. The philosophy must be converted into requirements and reviewable tasks.

## Architecture model

```text
North Star Philosophy
├── Web Agentic Accounting Philosophy
│   ├── command center UX
│   ├── agentic accounting workflow model
│   ├── evidence-first recommendations
│   └── approval/reversal UX
├── CLI Gentleman Fiscal Terminal
│   ├── Pi/OpenCode/Codex-inspired terminal model
│   ├── fiscal context and session memory
│   ├── slash commands / agent pane / workflows
│   └── safe execution gates
└── Philosophy Docs Alignment
    ├── AGENTS.md engineering contract
    ├── CODEX-MAP.md navigation contract
    ├── apps/web/MAP.md product direction
    ├── apps/cli/MAP.md terminal direction
    └── docs/product canonical philosophy
```

## Why separate plans

| Area           | Reason for separation                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Web            | Product/UX strategy affects React routes, components, design system, and agent surfaces.                  |
| CLI            | Go terminal experience has different constraints: latency, TUI state, shell workflows, and local context. |
| Docs/alignment | Repository guidance must be updated without mixing content governance with implementation.                |

## Delivery strategy

Use `auto-forecast`:

1. Parent strategy artifacts first.
2. Docs alignment second, because it makes the operating contract discoverable.
3. Web and CLI child plans can proceed in parallel after alignment.
4. Any implementation PR above 400 changed lines must be split unless explicitly approved as a review exception.

## Quality gates

- No fiscal behavior change without tests.
- No product claims without acceptance criteria.
- No agentic mutation without approval and audit trail.
- No CLI or web divergence in fiscal context semantics.
- No broad rewrite disguised as philosophy alignment.

## Open questions

- Which accounting workflows become the first flagship demos: monthly close, SIRE, reconciliation, or invoice lifecycle?
- Should the web command center prioritize executive visibility or operator throughput first?
- Which CLI workflows must work offline or degraded from the web/API?
