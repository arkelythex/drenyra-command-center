# ENGINE-QUALITY-GENTLEAI — Tasks (plan)

**Change**: `engine-quality-gentleai`
**Inputs**: `proposal.md`, `specs/engine-quality/spec.md`, `design.md` (design §9 order is authoritative)
**Mode**: strict TDD (`openspec/config.yaml: strict_tdd: true`), hybrid artifact store
**Rule**: no production behavior change — receipt hashing/signing semantics are frozen; only additive changes (2 Go struct fields, 2 legacy fixture fields, dev deps, new artifacts).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2,600–2,900 (schemas + 8 vectors + generator + 3 harnesses + ledger tooling + CI + docs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 → PR9 (9 PRs, see table below) |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

The parent's 4-PR skeleton (contracts+fixtures / harness TS / harness Go+Python / ledgers+scripts) is refined against the 400-line budget per design §9 ("chain boundaries between contracts/vectors, language harnesses, and ledger/CI"). Slices that would exceed ~400 lines are split; each PR stays independently reviewable with passing tests.

| PR | Scope (design step) | Est. lines | Risk |
|----|---------------------|-----------|------|
| PR1 | `contracts/receipt-schema/v1` schemas + manifest + README + legacy fixture update + ajv deps + TS schema test (step 1) | ~460 | Medium (static JSON-heavy) |
| PR2 | Dev keys + deterministic generator + in-memory determinism test (step 2) | ~330 | Low |
| PR3 | Commit 8-vector suite + extend generation/schema tests (step 2) | ~310 | Low |
| PR4 | TS conformance harness, local + trusted + status mapping (step 3) | ~210 | Low |
| PR5 | Go conformance harness + `SignedReceipt` struct fields (step 4) | ~260 | Low |
| PR6 | Python conformance helper + pytest + `cryptography` dev dep (step 5) + CI `receipt-conformance` job (step 6) | ~380 | Medium |
| PR7 | Ledger core + hash-chain tests (step 7) | ~390 | Medium |
| PR8 | Ledger JSON schemas + append/validate CLIs + CLI tests (step 7) | ~380 | Medium |
| PR9 | `docs/audits/` README + ledger initialization + invariant ESTABLISHED/VERIFIED + full regression (step 8) | ~180 | Low |

**Decision needed before apply**: resolve chain strategy (`stacked-to-main` vs `feature-branch-chain`) and confirm the first PR slice (PR1). Tasks below are ordered; apply processes them in order and checks off each checkbox.

---

## Tasks — implementation (apply-owned)

### PR1 — Receipt contract schemas + TS schema conformance (design step 1)

- [x] **T1 (RED)** — Add ajv dev deps and write the failing TS schema conformance test.
  - **Files**: `packages/mission-domain/package.json` (devDependencies: `ajv@8`, `ajv-formats`), `bun.lock`; new `packages/mission-domain/src/__tests__/conformance/receipt-schema.test.ts`.
  - **What**: Add the deps and author the test that compiles `contracts/receipt-schema/v1/schemas/{receipt-content,signed-receipt,signing-key-info}.schema.json` with draft-07 Ajv (`allErrors: true`, `strict: true`, `ajv-formats` for `date-time`), then validates (a) a typed sample built with `buildSignedReceipt`, and (b) the additive legacy fixture `fixtures/receipts/receipt-signed-valid.v1.json`. Resolve fixture paths from `import.meta.url`, not cwd.
  - **Done**: `bun run --filter @drenyra/mission-domain test` fails with missing-schema/module errors (RED confirmed). No other test breaks.
  - **blockedBy**: —

- [x] **T2 (GREEN)** — Create the canonical schemas, manifest, README, and the additive legacy fixture update.
  - **Files**: new `contracts/receipt-schema/v1/schemas/*.schema.json` (3), `contracts/receipt-schema/v1/manifest.json`, `contracts/receipt-schema/v1/README.md`; edited `fixtures/receipts/receipt-signed-valid.v1.json`.
  - **What**: Schemas per spec §2.2–§2.4 and design §3.2: draft-07, stable `$id` under `https://drenyra.dev/contracts/receipt-schema/v1/`, explicit `required`, `additionalProperties: false`, `receiptType` enum (4 values), `algorithm: "Ed25519"` const, `receiptHash` pattern `^[0-9a-f]{64}$`; `signed-receipt` `$ref`s content schema. `manifest.json` mirrors `contracts/data-engine/v1/manifest.json` metadata (contract/version/schema paths/fixture path/generator path, no HTTP header). README records field ownership, canonicalization, key formats, statuses, regeneration command, TEST-ONLY warning. Legacy fixture gains exactly `"receiptType": "APPROVAL"` and `"algorithm": "Ed25519"`; every content, hash, signature, key, timestamp value stays byte-identical.
  - **Done**: `receipt-schema.test.ts` green; `bun run --filter @drenyra/mission-domain typecheck` green; `git diff` of the legacy fixture shows only the two added fields; existing Go golden tests still pass (`TestGoldenReceiptFixtures` — Go ignores unknown fields).
  - **blockedBy**: T1

- [x] **T3 (REFACTOR)** — Verify schema/test parity and polish without behavior change.
  - **Files**: `contracts/receipt-schema/v1/schemas/*.schema.json`, `contracts/receipt-schema/v1/README.md`, `packages/mission-domain/src/__tests__/conformance/receipt-schema.test.ts`.
  - **What**: Re-read `packages/mission-domain/src/mission-receipt.ts` and `packages/mission-protocol/src/types.ts`; confirm field-for-field parity (no TS field omitted, no extra field allowed), Ajv strict mode emits no warnings, `$ref` reuse is clean, diagnostics include vector/fixture names.
  - **Done**: All checks above pass; zero changes to frozen hashing/signing semantics; suite still green.
  - **blockedBy**: T2

### PR2 — Dev keys + deterministic generator (design step 2, part 1)

- [x] **T4 (RED)** — Write the failing vector-generation determinism test.
  - **Files**: new `packages/mission-domain/src/__tests__/conformance/receipt-vector-generation.test.ts`.
  - **What**: Test asserts (1) running the generator twice in memory (caller-provided outputs, no writes) yields byte-identical vectors; (2) vector #1 preserves the frozen legacy hash `250df62bbfcf3f1b6b54641b45da81ca50fbf679e93ee50f75939e75c7eaee59` and the original signature; (3) the completion vector's content is byte-identical to approval's content (metadata-only change, D6). Fixed timestamps, never `new Date()`.
  - **Done**: Suite fails with missing generator/module errors (RED confirmed).
  - **blockedBy**: T2

- [x] **T5 (GREEN)** — Create the generator and the TEST-ONLY dev key pair file.
  - **Files**: new `scripts/conformance/generate-receipt-vectors.ts`, `contracts/receipt-schema/v1/fixtures/dev-keys.test-only.json`.
  - **What**: Generator per design §4.3: refuses keys without `classification: "TEST-ONLY"`; reads the legacy signed fixture, asserts frozen hash/signature before copying with additive metadata; derives completion by metadata-only change; signs fixed dev-key content with Node Ed25519 and fixed issuance times; derives negative cases via deterministic mutations (negative signatures remain valid base64 of 64 bytes, one byte changed); emits 8 vectors in spec §3.2 order as stable 2-space JSON + trailing newline; writes atomically only when explicitly invoked. Dev keys file: `{ classification: "TEST-ONLY", warning, keys: [{ keyId, publicKey, privateKey, issuedAt, expiresAt?, revokedAt? }] }` with fixed `key_dev_001..003` DER SPKI/PKCS8 pairs; expired/revoked dates fixed in the past.
  - **Done**: In-memory determinism assertions green; no vector file committed yet; generator does not touch operational key env vars.
  - **blockedBy**: T4

### PR3 — Commit the 8-vector suite + test extensions (design step 2, part 2)

- [x] **T6 (GREEN)** — Generate and commit the canonical vector suite.
  - **Files**: new `contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json`.
  - **What**: Run the generator explicitly once; commit the output. Suite contains exactly the 8 vectors of spec §3.2 in order (`receipt-valid-approval`, `receipt-valid-completion`, `receipt-tampered-hash`, `receipt-invalid-signature`, `receipt-wrong-signer`, `receipt-unknown-signer`, `receipt-key-expired`, `receipt-key-revoked`) with the §3.1 envelope (`name`, `description`, `receipt`, optional `trustedKeys`, `vectors: { receiptHash, signatureValid, status }`). Vector #1's `receiptHash`/`signature` are byte-for-value the legacy ones.
  - **Done**: Vectors committed; envelope and semantics match spec §3.1–§3.2; completion vector content === approval content (only `receiptType` differs).
  - **blockedBy**: T5

- [x] **T7 (TRIANGULATE)** — Extend generation and schema tests to the committed suite (REQ-HARNESS-004).
  - **Files**: `packages/mission-domain/src/__tests__/conformance/receipt-vector-generation.test.ts`, `packages/mission-domain/src/__tests__/conformance/receipt-schema.test.ts`.
  - **What**: Generation test adds a fresh-regeneration-vs-committed-bytes equality check (drift guard; never mutates the fixture). Schema test extends to validate every vector's `receipt` against `signed-receipt.schema.json`, every `content` against `receipt-content.schema.json`, every `trustedKeys` entry against `signing-key-info.schema.json`, plus the updated legacy fixture; diagnostics include vector names.
  - **Done**: Both suites green against the committed vectors; regeneration of committed bytes is byte-identical.
  - **blockedBy**: T6

### PR4 — TS conformance harness (design step 3)

- [x] **T8 (RED)** — Write the failing TS conformance suite.
  - **Files**: new `packages/mission-domain/src/__tests__/conformance/receipt-conformance.test.ts`.
  - **What**: Per vector: assert `generateReceiptHash(receipt.content) === vectors.receiptHash`; run `verifySignedReceipt(receipt)` asserting `signatureValid` and local mapping; when `trustedKeys` present, build a resolver from them (test-local helper typed as `KeyTrustResolver`), run `verifySignedReceiptTrusted(receipt, resolver)` and assert `status` exactly; when absent, assert against local mapping only. Imports a not-yet-existing status-vocabulary/mapping module (design §5.1: const status object + centralized local-equivalence mapping). Parse fixtures as `unknown`, narrow with test-only type guards, no `any`.
  - **Done**: Suite fails with unresolved module import (RED confirmed).
  - **blockedBy**: T7

- [x] **T9 (GREEN)** — Add the status/mapping helper module and complete the suite.
  - **Files**: new `packages/mission-domain/src/__tests__/conformance/conformance-status.ts`; complete `receipt-conformance.test.ts`.
  - **What**: `conformance-status.ts` defines the §2.6 status vocabulary as a const object and the local-equivalence mapping (`SIGNER_TRUSTED`/`VALID`/`UNKNOWN_SIGNER`/`KEY_EXPIRED`/`KEY_REVOKED` → local valid; `CONTENT_VALID` → hashValid && !signatureValid; `PAYLOAD_TAMPERED` → !hashValid). No production code changes — `mission-receipt.ts` is already authoritative and exported.
  - **Done**: All 8 vectors pass hash, signature, and status assertions; trusted vectors assert exact `verifySignedReceiptTrusted` statuses; `bun run --filter @drenyra/mission-domain test` green (existing 146 + new conformance suites).
  - **blockedBy**: T8

### PR5 — Go conformance harness (design step 4)

- [x] **T10 (RED)** — Write the failing Go conformance test.
  - **Files**: new `apps/cli/internal/harness/receipt_conformance_test.go`.
  - **What**: Local structs model the fixture envelope; for every vector: marshal nested `receipt`, call `ParseSignedReceipt`, assert `ReceiptType`/`Algorithm` round-trip non-empty, assert computed content hash === `vectors.receiptHash`, assert `VerifySignedReceiptLocally` signature result === `vectors.signatureValid`, and apply the §2.6 local-equivalence mapping (trusted statuses → `Valid == true`). Resolve the repo root by walking up from `runtime.Caller(0)` until the canonical vector file exists; absence is a hard failure, never a skip.
  - **Done**: `go test ./apps/cli/internal/harness -run ReceiptConformance -count=1` fails (round-trip fields empty / resolver missing) — RED confirmed.
  - **blockedBy**: T7

- [x] **T11 (GREEN)** — Extend the Go struct and add the root resolver.
  - **Files**: edited `apps/cli/internal/harness/receipt_signature.go`; `apps/cli/internal/harness/receipt_conformance_test.go`.
  - **What**: Add exactly `ReceiptType string \`json:"receiptType"\`` and `Algorithm string \`json:"algorithm"\`` to `SignedReceipt` (D5). No parsing/verification behavior changes. Add the root-path resolver helper (walk up until `contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json` exists; missing → test failure).
  - **Done**: `go test ./...` under `apps/cli` green (17 packages, incl. `TestGoldenReceiptFixtures`, `TestVerifySignedReceiptLocally`); conformance test verifies every vector incl. round-trip of `receiptType`/`algorithm`.
  - **blockedBy**: T10

### PR6 — Python conformance harness (design step 5) + CI drift-guard job (design step 6)

- [x] **T12 (RED)** — Write the failing Python conformance tests and declare the crypto dev dependency.
  - **Files**: new `apps/data-engine/tests/conformance/test_receipt_conformance.py`; edited `apps/data-engine/pyproject.toml` (`[dependency-groups].dev` + `cryptography`); refreshed `apps/data-engine/uv.lock`.
  - **What**: Pytest suite (parameterized by vector name) loads `contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json` via `Path(__file__).resolve().parents[4]`; asserts canonical hash (`json.dumps(content, sort_keys=True, separators=(",", ":"), ensure_ascii=False)` → SHA-256 hex) equals `vectors.receiptHash`, Ed25519 verification matches `vectors.signatureValid`, and the same local-equivalence mapping as Go; includes a non-integer `proposalVersion` rejection case. Add `cryptography` to the dev dependency group (D2) and update the lock.
  - **Done**: `uv run pytest tests/conformance` fails to collect (helper module and/or `cryptography` missing) — RED confirmed.
  - **blockedBy**: T7

- [x] **T13 (GREEN)** — Implement the Python canonical/signature helper.
  - **Files**: new `apps/data-engine/src/conformance/__init__.py`, `apps/data-engine/src/conformance/receipt_canonical.py`; complete `tests/conformance/test_receipt_conformance.py`.
  - **What**: Pure-Python helper exposing typed canonical-byte, SHA-256 hex, and Ed25519 verification functions; validates base64, loads DER SPKI via `serialization.load_der_public_key`, confirms Ed25519 key type, returns `False` for malformed keys/signatures instead of leaking crypto exceptions (design §5.3, §7). No repository-path knowledge in the helper.
  - **Done**: `uv run pytest tests/conformance` green; `uv run pytest` green (existing data-engine suite unaffected); frozen lock resolution consistent.
  - **blockedBy**: T12

- [x] **T14 (GREEN)** — Add the `receipt-conformance` CI job to `contracts-nightly.yml`.
  - **Files**: edited `.github/workflows/contracts-nightly.yml`.
  - **What**: Per D3: add a sibling `receipt-conformance` job (one checkout) with named steps — Bun setup + `bun install --frozen-lockfile` + `bun run --filter @drenyra/mission-domain test`; Go setup + `go test ./...` in `apps/cli`; Python 3.11 + uv setup + `uv sync --group dev --frozen` + `uv run pytest tests/conformance` in `apps/data-engine`. Add `pull_request` and `push` path filters (contracts/receipt-schema, harness surfaces, generator, workflow) while retaining `schedule` + `workflow_dispatch`; guard the existing heavy `contracts` job to continue only for scheduled/manual runs.
  - **Done**: Workflow YAML validates (lint/manual review); the three surface commands run green locally against the same committed vectors; existing job semantics preserved.
  - **blockedBy**: T9, T11, T13

### PR6 — Ledger core + schemas + CLI (design §6 rev. 2)

- [x] **T15 (RED)** — Write the failing ledger-core tests (NDJSON format).
  - **Files**: new `scripts/ledger/__tests__/ledger-core.test.ts`.
  - **What**: Tests with injected fixed clock covering, per design §6 rev.2: valid genesis; valid append; altered chain (edit prior line → recompute mismatch, no write); sequence gap; incorrect `previousEntryHash`; mutated payload; mutated receipt reference; idempotency conflict (same key + different content); unknown version rejection; entryTypes vocabulary (GENESIS|RECEIPT_RECORDED|ATTESTATION_ADDED|ENTRY_SUPERSEDED|ENTRY_REVOKED|CHECKPOINT_CREATED); `entryHash` formula §6.5 (canonicalHeader || payloadHash || receiptHash || previousEntryHash); optimistic append head-conflict; duplicate detection; hash-only vs signed mode.
  - **Done**: Suite fails with missing `ledger-core.ts` module (RED confirmed).
  - **blockedBy**: T14

- [x] **T16 (GREEN)** — Implement `ledger-core.ts` (pure functions, no fs/CLI).
  - **Files**: new `scripts/ledger/ledger-core.ts`.
  - **What**: Pure functions per design §6.5-6.8: `createGenesisEntry()`, `createLedgerEntry()`, `computeEntryHash()`, `appendEntry()` (optimistic: expectedHeadHash + expectedSequence → AppendResult appended|head-conflict|duplicate|invalid-chain), `validateLedger()` (returns `LedgerValidationReport` with structured findings — schema, canonicalization, entry hash, previous hash, sequence continuity, ledger identity, receipt references, signature/trust policy, unsupported versions, duplicate entries, genesis validity). Canonicalization reuses the sorted-keys serialization validated in TS/Go/Python receipt conformance — no second representation. Idempotency: `ledgerId + idempotencyKey` → same content replays existing entry, different content conflicts. Genesis: protocol version, hash algorithm, trust root, jurisdiction/scope, creation date, signing policy, manifest; previousEntryHash = SHA-256 of empty string (canonically specified).
  - **Done**: `bunx vitest run scripts/ledger` green; tamper tests prove no-write; validation never stops at first error (collects all findings).
  - **blockedBy**: T15

- [x] **T17 (GREEN)** — Author the ledger schemas.
  - **Files**: new `docs/audits/schemas/ledger-entry.schema.json`, `docs/audits/schemas/ledger-manifest.schema.json`.
  - **What**: Draft-07 single-entry schema per §6.2: entryId (uuid), ledgerId, sequence (integer ≥ 1), previousEntryHash (64-hex), entryType (vocabulary), payloadHash, receiptHash, occurredAt/recordedAt (RFC 3339), actor, schemaVersion, signerKeyId; optional signature/signerPublicKey together. Manifest schema for genesis (§6.7): protocolVersion, hashAlgorithm, trustRoot, jurisdiction, createdAt, signingPolicy, manifest.
  - **Done**: Schemas exist and match §6 field-for-field; entries produced by the core (T16) conform; vocabularies exact.
  - **blockedBy**: T16

- [x] **T18 (GREEN)** — Implement the `drenyra-ledger` CLI (thin adapter) + CLI tests.
  - **Files**: new `scripts/ledger/cli.ts`; extend `scripts/ledger/__tests__/ledger-cli.test.ts`.
  - **What**: `drenyra-ledger init|append|validate|inspect` per §6.9. Thin adapter only: parse args → read inputs → invoke ledger core → render structured result. No cryptographic rules inside the command. `append --receipt <file> --idempotency-key <key>`; `validate --trust-root <file> [--json]`; `inspect` prints entries. NDJSON read/write: append line, atomic temp+rename.
  - **Done**: CLI tests green; init creates genesis; append links chain; validate returns structured findings (exit 0 clean, 1 findings); tampered chain → non-zero exit and no write; `--json` output parseable.
  - **blockedBy**: T16, T17

### PR7 — Ledger initialization + docs/audits (design §6 rev. 2)

- [ ] **T19 (GREEN)** — Write `docs/audits/README.md`.
  - **Files**: new `docs/audits/README.md`.
  - **What**: Documents ledger purpose, entry schema (§6.2), hash-chain rules (§6.5), append/validate CLI usage (§6.9), entryTypes vocabulary (§6.3), signed-mode opt-in (§6.10); includes a "Last updated" line; marks dev keys as TEST-ONLY where referenced.
  - **Done**: README exists with all sections above and a Last updated line.
  - **blockedBy**: T18

- [ ] **T20 (GREEN)** — Initialize the canonical ledger via the CLI and record this phase's events.
  - **Files**: new `docs/audits/data/main.ndjson` (CLI-generated via `drenyra-ledger`, NOT hand-written).
  - **What**: Use `drenyra-ledger init` with a real manifest (protocolVersion, hashAlgorithm SHA-256, trustRoot, jurisdiction PE, createdAt, signingPolicy) then `drenyra-ledger append` for: RECEIPT_RECORDED entries for the receipt contracts + fixtures creation, each conformance surface (TS/Go/Python), the CI conformance job, and the ledger foundation itself; CHECKPOINT_CREATED after the conformance gate. No historical backfill (forward-only). Hash-only mode (no production keys).
  - **Done**: `docs/audits/data/main.ndjson` exists, `drenyra-ledger validate` reports VALID, and the entries reference the real receipt hashes from this phase.
  - **blockedBy**: T19

- [ ] **T21 (TRIANGULATE)** — Append the conformance gate checkpoint and run the full regression.
  - **Files**: extends `docs/audits/data/main.ndjson`.
  - **What**: After all three conformance surfaces pass, append a CHECKPOINT_CREATED entry recording the head hash of the receipt conformance vectors. Run the full regression gate: vitest (mission-domain + scripts/ledger), go test (apps/cli), pytest (data-engine conformance).
  - **Done**: Ledger VALID with checkpoint; all regression surfaces green.
  - **blockedBy**: T20

