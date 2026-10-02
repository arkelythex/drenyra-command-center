# AI Policy

**Última actualización**: 2026-10-02

How AI assistants and agents may work in this repository. Operational rules live in [`AGENTS.md`](AGENTS.md) (canonical) and [`CLAUDE.md`](CLAUDE.md); this page is the short, human-readable contract.

## What AI may do

- Investigate, propose and implement changes under the **ODD** workflow ([`docs/10-development/odd-workflow.md`](docs/10-development/odd-workflow.md)): simple work directly, uncertain work after research, large work after a task document in `odd/tasks/` is authorized.
- Run the repo's own checks (`bun run typecheck`, `bun run lint`, per-package Vitest, `bun run docs:verify`) and report results faithfully, including failures.

## What requires more care

For **critical** areas — `packages/domain`, SUNAT/SIRE/UBL/IGV, invoicing, ledgers, database and migrations, AI control, CI, tenant isolation — AI work must be **test-first**, receive a **high-risk review**, and run in an isolated worktree. Run `bun scripts/sire-ledger-repro-check.ts` when touching invoicing or books.

## What AI must not do

- Introduce secrets, real credentials, production tokens or real customer/fiscal data (including in examples, tests and memory systems).
- Send real fiscal or customer data to third-party services.
- Skip, disable or quarantine a test to get green.
- Make irreversible or externally visible changes (publishing, deleting, pushing to protected branches) without explicit authorization.
- Recreate `openspec/` or SDD workflows (the tooling rejects them).

## Accountability

- Material fiscal decisions need professional human approval; risk levels run from R0 (read) to R3 (irreversible, dual approval).
- Persistent memory (Engram) **informs, never authorizes**; the database is the transactional truth and receipts are the proof of execution.
- Review (RDD) and test-first are independent switches; in critical areas both are always on.

## Models

Fiscal logic and architecture: Claude models. Multimodal, bulk logs and invoice OCR: Gemini.
