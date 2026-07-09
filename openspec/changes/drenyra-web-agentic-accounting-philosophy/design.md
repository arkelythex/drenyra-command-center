# Design — Drenyra Web Agentic Accounting Philosophy

## Experience architecture

```text
apps/web
├── Outcome navigation
│   ├── Close period
│   ├── Reconcile
│   ├── Review risk
│   ├── Prepare SIRE
│   └── Prove compliance
├── Workspace center
│   ├── accounting artifact
│   ├── workflow checklist
│   ├── fiscal diff
│   └── decision queue
└── Context rail
    ├── agent reasoning
    ├── evidence vault
    ├── approval state
    ├── confidence/risk
    └── reversal/audit path
```

## Design principles

| Principle              | Design consequence                                                  |
| ---------------------- | ------------------------------------------------------------------- |
| Fiscal truth first     | Accounting state is never hidden behind a generated summary.        |
| Agent with evidence    | Agent messages link to source records and affected scope.           |
| Human control          | Mutations are prepared, explained, approved, then executed.         |
| Workflow over modules  | Routes are implementation details; outcomes are user mental models. |
| Progressive disclosure | Summary first, evidence and rule details on demand.                 |

## Existing plan alignment

| Existing plan           | Alignment                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| F1 Agentic Shell        | Provides the shell for outcome navigation and context rail.               |
| F2 Thread System        | Provides durable workflow context and conversation history.               |
| F3 Agents Window        | Provides multi-agent visibility, but should stay tied to real workflows.  |
| F4 Accounting Diff      | Becomes the central review/evidence surface for risky changes.            |
| F5 Skills + Automations | Must require approval policies and audit output.                          |
| F6 Evidence Vault 2.0   | Becomes the proof layer for agentic accounting.                           |
| AM1–AM4                 | Continue reducing navigation sprawl and moving work into tools/artifacts. |

## Implementation slicing guidance

This planning change does not implement UI. Future implementation should be sliced as:

1. Documentation and MAP alignment.
2. One flagship workflow experience map.
3. Context rail/evidence primitives.
4. Approval/reversal patterns.
5. Metrics and usability verification.

## Risk controls

- Do not remove existing fiscal routes until replacement workflows are proven.
- Do not introduce agentic mutations without tests and approval semantics.
- Do not use generic AI chat patterns for accounting decisions.
- Do not optimize for visual novelty over auditability.
