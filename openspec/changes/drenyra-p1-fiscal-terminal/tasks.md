# Tasks — P1 Fiscal Terminal

## PR 1 — Agent pane and status bar

- [ ] Implement the agent pane only after command semantics and fiscal scope are
      visible in the TUI.
- [ ] Show company, RUC, period, workflow, evidence state, and approval state in
      the terminal context area.
- [ ] Preserve the original command error when the agent suggests a correction.
- [ ] Add Go tests for state transitions or command failure behavior where
      practical.

## PR 2 — Slash commands and autocomplete

- [ ] Classify each slash command as read-only, mutating, workflow, or local-only.
- [ ] Require fiscal scope for commands that inspect or mutate fiscal data.
- [ ] Keep slash command output scriptable where a headless equivalent exists.
- [ ] Add golden output or command validation tests for stable command behavior.

## PR 3 — Fiscal sessions with memory

- [ ] Store only safe run metadata, evidence references, checksums, and summaries.
- [ ] Do not store secrets, tokens, raw customer documents, or sensitive payloads
      in local memory/history.
- [ ] Make resume behavior show scope, evidence, pending approval, and recovery
      path before continuing.
- [ ] Add tests for session serialization and privacy constraints where practical.

## PR 4 — Fiscal sub-agents

- [ ] Give each sub-agent explicit fiscal scope and domain boundaries.
- [ ] Require evidence, confidence, affected scope, and unresolved risk in agent
      recommendations.
- [ ] Route risky actions through explicit approval and audit output.
- [ ] Keep every PR under the review budget or document the exception.

## Verification

- [ ] Run `go test ./...` from `apps/cli` or the root Bun wrapper when code
      changes are introduced.
- [ ] Verify command semantics before TUI polish.
- [ ] Verify fiscal scope, approval, and audit output for mutating flows.
