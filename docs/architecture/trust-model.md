# Trust Model — Drenyra (Accounting Command Center)

> **Last updated:** 2026-08-01.

> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version/sequence numbers are JSON integers, never floats.

## Model in one line

**Drenyra is human-supervised AI execution.** Agents propose; deterministic validators check; professionals approve material decisions; every action produces an immutable evidence receipt.

## Trust boundaries

### 1. AI agents never authorize material actions

- Agents propose candidates, drafts, and flags under strict tool contracts.
- Material execution requires human approval (explicit R2/R3 for high materiality).
- No path lets an agent skip the professional.

### 2. Deterministic validators check; they don't decide

- Validators verify invariants before, during, and after operations.
- A validator PASS is **necessary, never sufficient** for material action.
- Fiscal correctness is architecture, not a test phase.

### 3. Professionals authorize

- Approval is an explicit, recorded event — never implied.
- Professionals approve candidates, not intentions.
- Approval records are receipted through `drenyra-ai` gates and receipts.

### 4. Memory informs; it never authorizes

- Drenyra reads `drenyra-engram` for context and institutional knowledge.
- A memory observation is never treated as permission.
- Policy restricts; evidence demonstrates; receipts certify; professionals authorize.

### 5. Evidence and receipts are the audit spine

- Every material action produces an immutable, Ed25519-verifiable receipt.
- Receipts verify offline, independently of Drenyra.

## Fail-closed default

When context is missing (no company, no fiscal period, no professional in scope), Drenyra **fails closed**: the operation does not proceed. Ambiguity is surfaced to a human, never resolved by guessing.

## Interaction with `drenyra-ai` gates

Drenyra does not implement its own authority model. Lifecycle gates (authority, scope, receipts) run in `drenyra-ai`; Drenyra presents them in the product surface and records their outcomes in the evidence graph.

## Operational consequences

- Every material workflow ends in a receipted, human-approved event — or it does not end at all.
- Audit questions are answered from the evidence graph, never from memory or chat logs.
