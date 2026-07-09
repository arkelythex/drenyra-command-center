# Drenyra product philosophy

**Last updated**: 2026-07-08
**Content type**: Conceptual
**OpenSpec source**: [`drenyra-north-star-philosophy`](../../openspec/changes/drenyra-north-star-philosophy/proposal.md)

Drenyra is the national-grade fiscal intelligence platform for Peru: an agentic accounting operating system where every fiscal action is explainable, auditable, reversible, tenant-scoped, and approved by a human when risk requires it.

## Who this is for

Use this page when you design product flows, write specs, review pull requests, or ask an agent to change Drenyra. It defines the product direction that web, CLI, agents, and documentation must share.

## North star

Drenyra should make fiscal work safer, clearer, and faster without hiding the accounting truth. Agents may accelerate preparation, comparison, explanation, and execution, but they cannot bypass SUNAT, UBL 2.1, SIRE, IGV, retenciones, detracciones, tenant isolation, audit trails, or approval gates.

## Product references

These products are references, not templates to copy:

| Reference                       | What Drenyra should learn                                                  |
| ------------------------------- | -------------------------------------------------------------------------- |
| Codex app                       | Focused task execution, context awareness, and verification loops          |
| Cursor 3.0                      | Contextual collaboration across edit, explain, review, and execute flows   |
| Digits AI accounting            | Modern accounting clarity, automation, and visual financial confidence     |
| Global accounting leaders       | Trust, reconciliation, reporting, period close, controls, and auditability |
| Pi CLI, OpenCode, and Codex CLI | Terminal-native workflows, harness discipline, and precise execution       |
| Gentleman philosophy            | Spec-driven development, review empathy, teaching, and controlled agents   |

## Web app philosophy

The web app is Drenyra’s agentic fiscal command center. It should feel like a supervised operations room for accounting work, not a collection of disconnected enterprise resource planning pages.

Use this model:

```text
Left: outcome navigation and command entry
Center: fiscal workspace, accounting artifact, or workflow
Right: evidence, agent reasoning, approvals, and next actions
```

Web product work must follow these rules:

- **Outcome-first navigation**: prefer close period, reconcile, review tax risk, prepare SIRE, prove compliance
- **Evidence beside action**: show source records, confidence, affected company, RUC, period, and unresolved risks
- **Progressive disclosure**: show status and next action first, then rule details, source rows, and audit history
- **Agent as operator**: let agents explain, compare, prepare, and execute approved tasks with evidence
- **Review queue as product surface**: route risky accounting changes through diffs, approvals, and audit capture

## CLI philosophy

The CLI is Drenyra’s Gentleman Fiscal Terminal. It should be terminal-native, scriptable, fiscal-safe, agentic, and aligned with the web command center.

Use this model:

```text
Shell commands + guided TUI + fiscal context + agentic execution gates
```

CLI product work must follow these rules:

- **Shell before spectacle**: commands and JSON output must work before terminal UI polish
- **TUI for cognition**: Bubble Tea screens should show context, evidence, approvals, and next action
- **Mandatory fiscal context**: fiscal commands must carry organization, company, RUC, and period where relevant
- **Gated agentic actions**: agents can prepare and recommend, but risky mutations require approval and audit output
- **Bounded local continuity**: local memory and history can store operational context, not secrets or sensitive customer data

## Agentic accounting guardrails

Every agentic accounting workflow must document these facts before implementation:

| Guardrail    | Required answer                                                              |
| ------------ | ---------------------------------------------------------------------------- |
| Fiscal scope | Which organization, company, RUC, and period does this affect?               |
| Evidence     | Which records, documents, rules, or external results support the suggestion? |
| Confidence   | What is known, what is uncertain, and what blocks execution?                 |
| Approval     | Who must approve the action, and when can the system proceed?                |
| Reversal     | How can an operator undo, correct, or audit the result?                      |
| Persistence  | Which evidence and decisions enter the audit trail?                          |

## Human control rules

Drenyra must keep humans in control of high-risk fiscal work:

- Agents may propose a change, but they must show evidence before execution
- Mutating fiscal actions need explicit approval when they affect compliance, money, reports, SUNAT submissions, or audit trails
- The product must preserve the original error when it offers a correction
- Audit output must explain who approved, what changed, why it changed, and which evidence supported it
- Workflows must fail closed when scope, evidence, or approval is missing

## What Drenyra should not become

Drenyra should avoid these traps:

- A generic chatbot attached to accounting screens
- A beautiful dashboard that cannot prove fiscal truth
- An agent that hides source data behind summaries
- A CLI that mutates fiscal state without scope and approval
- A large rewrite that breaks reviewability and audit confidence
- A copy of another product’s interface, language, or claims

## Review checklist

Use this checklist for product, web, CLI, and agentic accounting changes:

- [ ] The change preserves SUNAT, UBL 2.1, SIRE, IGV, retenciones, detracciones, and audit invariants
- [ ] The change preserves tenant, company, and RUC scoping
- [ ] Agent recommendations expose evidence, confidence, scope, and approval state
- [ ] Risky fiscal mutations require human approval and audit output
- [ ] The web and CLI use compatible fiscal concepts
- [ ] The pull request stays under the 400-line review budget or documents an exception
- [ ] Documentation explains the why, the non-goals, and the verification path

## Related OpenSpec plans

| Plan                                                                                                                        | Purpose                                |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [`drenyra-north-star-philosophy`](../../openspec/changes/drenyra-north-star-philosophy/proposal.md)                         | Parent strategy and product guardrails |
| [`drenyra-web-agentic-accounting-philosophy`](../../openspec/changes/drenyra-web-agentic-accounting-philosophy/proposal.md) | Web command center model               |
| [`drenyra-cli-gentleman-fiscal-terminal`](../../openspec/changes/drenyra-cli-gentleman-fiscal-terminal/proposal.md)         | CLI fiscal terminal model              |
| [`drenyra-philosophy-docs-alignment`](../../openspec/changes/drenyra-philosophy-docs-alignment/proposal.md)                 | Documentation and guidance rollout     |
