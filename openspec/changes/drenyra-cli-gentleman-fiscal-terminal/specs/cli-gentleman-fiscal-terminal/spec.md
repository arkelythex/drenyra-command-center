# Specification — Drenyra CLI Gentleman Fiscal Terminal

## Requirements

### Requirement 1: CLI identity

Drenyra CLI SHALL define itself as a Gentleman Fiscal Terminal:
terminal-native, fiscal-safe, agentic, scriptable, and reviewable.

#### Requirement 1 acceptance criteria

- CLI philosophy distinguishes shell/headless commands from TUI workflows.
- CLI guidance references Pi/OpenCode/Codex/Gentleman as inspiration, not
  cloning targets.
- CLI docs explain when to use command, TUI, workflow, and exec modes.

### Requirement 2: Fiscal context enforcement

CLI workflows that inspect or mutate fiscal data SHALL require explicit fiscal
scope.

#### Requirement 2 acceptance criteria

- Scope includes organization/company/RUC/period where relevant.
- Commands document whether they are read-only or mutating.
- Mutating commands require approval semantics and audit output.

### Requirement 3: Agentic terminal guardrails

CLI agents SHALL operate through prepared actions, explanations, and approval
gates.

#### Requirement 3 acceptance criteria

- Agents cannot silently mutate fiscal state.
- Agent recommendations include evidence and affected scope.
- Failed commands can produce corrective suggestions without hiding the original
  error.
- Local memory/history must not store secrets or sensitive customer data.

### Requirement 4: Web/CLI semantic parity

CLI and web SHALL share core fiscal concepts even when the UX differs.

#### Requirement 4 acceptance criteria

- Evidence, approval, fiscal work item, audit trail, and reversal concepts are
  named consistently.
- A CLI action can be traced to web-visible evidence where supported.
- A web workflow can expose CLI reproduction steps where useful.

### Requirement 5: Reviewable implementation slicing

Future CLI implementation SHALL be split into PRs under the review budget.

#### Requirement 5 acceptance criteria

- Each implementation slice has narrow test scope.
- Go tests are included for command behavior, fiscal context, and TUI state
  where practical.
- PRs over 400 changed lines are split or explicitly marked as exceptions.
