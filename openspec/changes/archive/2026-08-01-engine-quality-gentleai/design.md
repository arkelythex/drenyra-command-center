# ENGINE-QUALITY-GENTLEAI — Design

**Change**: `engine-quality-gentleai`  
**Artifact store**: hybrid  
**Scope**: Phase A receipt contracts, three-language conformance, and audit-ledger foundation.

## 1. Constraints

- `packages/mission-domain/src/mission-receipt.ts` remains authoritative.
- Existing receipt content, payload hashes, `receiptHash`, and signatures are frozen.
- `receiptType` and `algorithm` are bundle metadata and never enter canonical content bytes.
- Canonical vectors are committed static test artifacts generated only by an explicit maintenance command.
- Ledger `receipt_hash` is a pure content hash; `prev_hash` carries chain linkage.
- Apply follows strict TDD and does not introduce fiscal or tenant production data.
- This design does not change application behavior.

## 2. Decisions

### D1 — JSON Schema validator

No repository `package.json` declares `ajv`. Add `ajv` 8 and `ajv-formats` as development dependencies of `packages/mission-domain`, the owner of the Vitest conformance suite. Configure draft-07 Ajv with `allErrors: true` and `strict: true`; register `ajv-formats` for RFC 3339 `date-time` checks.

Manual validation is rejected because REQ-HARNESS-004 requires a standard draft-07 validator and hand-written checks would duplicate `$ref`, `additionalProperties`, and format behavior. Both dependencies remain test-only.

### D2 — Python cryptography

`apps/data-engine/pyproject.toml` and `uv.lock` declare neither `cryptography` nor `PyNaCl`. Add `cryptography` to `[dependency-groups].dev` and refresh `apps/data-engine/uv.lock`. Do not add it to runtime dependencies.

`cryptography` is preferred because `serialization.load_der_public_key` directly accepts the required DER SPKI encoding. PyNaCl would require separate SPKI extraction. Leave the existing optional-dev section unchanged; dependency-section cleanup is outside scope.

### D3 — CI workflow

Extend `.github/workflows/contracts-nightly.yml` with a sibling `receipt-conformance` job. Do not merge the commands into the existing data-engine service-contract job: independent jobs give clear diagnostics.

Add relevant `pull_request` and `push` path filters while retaining `schedule` and `workflow_dispatch`. Since triggers apply to the whole workflow, guard the existing heavy `contracts` job so it continues only for scheduled/manual runs. The new job runs for every configured event and performs:

1. Bun setup, `bun install --frozen-lockfile`, then `bun run --filter @drenyra/mission-domain test`.
2. Go setup, then `go test ./...` in `apps/cli`.
3. Python 3.11 and uv setup, `uv sync --group dev --frozen`, then `uv run pytest tests/conformance` in `apps/data-engine`.

One job and one checkout make the shared-fixture dependency explicit; named steps retain per-surface failures.

### D4 — Python layout

Use the data-engine-local package:

```text
apps/data-engine/src/conformance/__init__.py
apps/data-engine/src/conformance/receipt_canonical.py
apps/data-engine/tests/conformance/test_receipt_conformance.py
```

Do not create `packages/conformance`. The pytest file resolves repository root with `Path(__file__).resolve().parents[4]` and reads the root contract fixture. The helper accepts parsed values and has no repository-path knowledge.

### D5 — Go and legacy fixture drift

Add only these fields to Go `SignedReceipt`:

```go
ReceiptType string `json:"receiptType"`
Algorithm   string `json:"algorithm"`
```

Do not change parsing or verification behavior. Add only `"receiptType": "APPROVAL"` and `"algorithm": "Ed25519"` to `fixtures/receipts/receipt-signed-valid.v1.json`; preserve every existing content, hash, signature, key, and timestamp value.

The new Go conformance test locates repository root by walking upward from `runtime.Caller(0)` until the canonical vector file exists. Absence is a hard failure, not a skipped test. Existing legacy fixture helpers remain unchanged.

### D6 — Completion-vector ambiguity

`receipt-valid-completion` keeps the exact content and cryptographic fields of `receipt-valid-approval` and changes only `receiptType` to `COMPLETION`. The private key for `key_test_001` is intentionally unavailable, and identical content is necessary both to preserve its signature and to prove metadata exclusion.

This resolves the specification phrase suggesting a different `missionId`, which conflicts with the frozen signature and the metadata-only assertion. Harnesses also vary bundle metadata in memory and prove that content hashing is unchanged. No stored hash is rewritten.

## 3. Receipt contract architecture

### 3.1 Exact tree

```text
contracts/receipt-schema/v1/
├── manifest.json
├── README.md
├── schemas/
│   ├── receipt-content.schema.json
│   ├── signed-receipt.schema.json
│   └── signing-key-info.schema.json
└── fixtures/
    ├── conformance-vectors.v1.json
    └── dev-keys.test-only.json

scripts/conformance/
└── generate-receipt-vectors.ts
```

`manifest.json` follows the `contracts/data-engine/v1/manifest.json` metadata precedent and declares `contract`, `version`, schema paths, fixture path, and generator path. It has no HTTP header metadata because receipts are artifacts rather than endpoint contracts.

`README.md` records field ownership, canonicalization, key formats, statuses, regeneration command, and a prominent TEST-ONLY warning.

### 3.2 Schema contracts

All schemas use draft-07, stable `$id` values under `https://drenyra.dev/contracts/receipt-schema/v1/`, explicit `required` arrays, and `additionalProperties: false`.

- `receipt-content.schema.json` validates all ten `ReceiptContent` fields. `decision` is `APPROVE|REJECT`; `proposalVersion` is an integer with minimum zero; `timestamp` uses `date-time`.
- `signing-key-info.schema.json` validates `keyId`, DER-SPKI base64 `publicKey`, `issuedAt`, optional `expiresAt`, and optional `revokedAt`.
- `signed-receipt.schema.json` references the content schema; constrains `protocolVersion` to `"1.0"`, `receiptType` to all four protocol values, `algorithm` to `"Ed25519"`, and `receiptHash` to lowercase SHA-256 hex. Public key and signature use base64 lexical patterns. Decoded key/signature lengths are checked by the TS harness because draft-07 cannot portably enforce decoded length.

Schemas enforce shape. Hash consistency, signature validity, and trust lifecycle remain harness responsibilities.

## 4. Canonical vectors

### 4.1 Format and cases

`conformance-vectors.v1.json` uses the specified envelope unchanged:

```text
{ contract, version, vectors: [{ name, description, receipt, trustedKeys?, vectors: { receiptHash, signatureValid, status } }] }
```

It initially contains the eight required cases in the specification order. Negative signatures remain syntactically valid base64 representing 64 bytes, with one deterministic byte changed, so they pass schema validation and fail cryptographic verification.

### 4.2 Fixed test keys

`dev-keys.test-only.json` is valid JSON with:

```text
{ classification: "TEST-ONLY", warning: "...", keys: [{ keyId, publicKey, privateKey, issuedAt, expiresAt?, revokedAt? }] }
```

Keys `key_dev_001..003` are fixed Ed25519 DER SPKI/PKCS8 pairs. All timestamps are fixed. Expired and revoked lifecycle dates are fixed in the past; valid keys omit expiry. The generator uses no current clock or random key material.

### 4.3 Deterministic generator

`scripts/conformance/generate-receipt-vectors.ts`:

1. Requires the TEST-ONLY classification.
2. Reads the legacy signed fixture and asserts its frozen hash `250df62bbfcf3f1b6b54641b45da81ca50fbf679e93ee50f75939e75c7eaee59` and signature before copying it with additive metadata.
3. Produces completion by changing metadata only.
4. Signs fixed content for dev-key vectors using Node Ed25519 and fixed issuance times.
5. Derives negative cases through deterministic mutations after creating a valid receipt.
6. Emits vectors in required order as stable two-space JSON with a trailing newline.
7. Writes atomically only when explicitly invoked.

A generator test produces bytes twice in memory or at caller-provided outputs, compares both runs, and compares against the committed fixture. Routine harness tests never regenerate committed files.

## 5. Harnesses and data flow

```text
fixed TEST-ONLY keys + fixed synthetic content
        │ explicit generator
        ▼
conformance-vectors.v1.json ─► TS schema/hash/signature/trust
        │                    ├► Go hash/signature/local mapping
        │                    └► Python hash/signature/local mapping
        └────────────────────── CI reads the same committed bytes
```

Each language computes canonical content bytes independently.

### 5.1 TypeScript

Create:

```text
packages/mission-domain/src/__tests__/conformance/receipt-conformance.test.ts
packages/mission-domain/src/__tests__/conformance/receipt-schema.test.ts
packages/mission-domain/src/__tests__/conformance/receipt-vector-generation.test.ts
```

Resolve files from `import.meta.url`, not the process working directory. Parse fixtures as `unknown` and narrow with test-only type guards; use no `any`. Define status vocabulary as a const object and centralize local-equivalence mapping.

- Conformance test: recompute each hash, run local verification, and run trusted verification with a resolver built from `trustedKeys` when present.
- Schema test: compile all schemas once, validate every canonical receipt/content/trusted key and the additive legacy signed fixture, and include vector names in diagnostics.
- Generation test: prove repeatability and equality with committed bytes without mutating the fixture.

### 5.2 Go

Create `apps/cli/internal/harness/receipt_conformance_test.go`. Local structs model the fixture envelope. For every vector:

1. marshal nested `receipt` and call `ParseSignedReceipt`;
2. assert `ReceiptType` and `Algorithm` round-trip;
3. use `VerifyReceiptLocally` for computed hash validity and `VerifySignedReceiptLocally` for signature/overall validity;
4. assert expected hash, signature, and local-equivalence result.

Trusted lifecycle statuses map to local `Valid=true`; `CONTENT_VALID` maps to hash-valid/signature-invalid; `PAYLOAD_TAMPERED` maps to hash-invalid and overall invalid. Go trust-lifecycle implementation remains out of scope.

### 5.3 Python

`receipt_canonical.py` exposes typed canonical-byte, SHA-256, and Ed25519 verification functions. Canonical JSON is:

```python
json.dumps(content, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
```

Tests reject a non-integer `proposalVersion`. Verification validates base64, loads DER SPKI through `cryptography`, confirms Ed25519 key type, and returns `False` for malformed keys/signatures rather than leaking crypto exceptions.

Pytest loads the suite once, parameterizes by vector name, and applies the same local mapping as Go. Python trust lifecycle is out of scope.

## 6. Audit ledger architecture (rev. 2 — product refinement 2026-08-01)

Canonical ledger is **NDJSON append-only**: one canonical entry per line. No update/delete/rewrite; the only mutations are append, supersede, revoke, compensate — history stays visible. SQLite is deferred as an index/projection, never the canonical evidence.

### 6.1 Separation

```text
Canonical ledger  → NDJSON file, append-only, verifiable (the evidence)
Ledger index      → rebuildable storage for queries (never primary evidence)
Ledger projection → derived view
```

### 6.2 Exact tree

```text
docs/audits/
├── README.md
├── schemas/
│   ├── ledger-entry.schema.json        (draft-07, single entry)
│   └── ledger-manifest.schema.json     (draft-07, genesis manifest)
└── data/
    ├── main.ndjson                     (canonical ledger)
    └── genesis.ndjson                  (or genesis entry as first line of main.ndjson — see 6.7)

scripts/ledger/
├── ledger-core.ts                      (pure functions, no fs/CLI)
├── cli.ts                              (thin adapter: drenyra-ledger)
└── __tests__/
    ├── ledger-core.test.ts
    └── ledger-cli.test.ts
```

### 6.3 Entry types (infrastructure only for PR6)

```text
GENESIS            — ledger bootstrap, fixes protocol/trust/policy
RECEIPT_RECORDED   — a signed receipt is recorded as backing evidence
ATTESTATION_ADDED  — an attestation is attached to a receipt/entry
ENTRY_SUPERSEDED   — a prior entry is superseded (history preserved)
ENTRY_REVOKED      — a prior entry is revoked (history preserved)
CHECKPOINT_CREATED — periodic head checkpoint
```

Fiscal-specific types arrive later via versioned schemas.

### 6.4 Entry identity

```text
entryId     → global stable identity (uuid)
sequence    → position within the ledger (monotonic, never identity)
receiptId   → execution that originated/backs the entry
```

`ledgerId + sequence` is unique and monotonic. `sequence` is never a timestamp.

### 6.5 Canonical hash chain

Entry commits: `ledgerId, sequence, previousEntryHash, entryType, payloadHash, receiptHash, occurredAt, recordedAt, actor, schemaVersion`.

```text
entryHash =
  H(canonicalHeader || payloadHash || receiptHash || previousEntryHash)
```

Canonicalization reuses EXACTLY the validated sorted-keys serialization from receipts (TS/Go/Python conformance) — no second representation. `canonicalHeader` = sorted-key compact JSON of {ledgerId, sequence, entryType, occurredAt, recordedAt, actor, schemaVersion, entryId}. `previousEntryHash` of GENESIS is the empty-string SHA-256 (specified canonically, never informal null).

### 6.6 Optimistic append + idempotency

```ts
append({ ledgerId, expectedHeadHash, expectedSequence, entry })
// → AppendResult (appended | head-conflict | duplicate | invalid-chain)
```

Two writers appending on the same head must be detected. Idempotency key: `ledgerId + idempotencyKey`; same content replayed → existing entry; same key different content → conflict.

### 6.7 Genesis

Every ledger begins with a GENESIS entry fixing: protocol version, hash algorithm, initial key/trust root, jurisdiction/scope, creation date, signing policy, ledger manifest. No informal null previousHash.

### 6.8 Validation

`validate` checks: schema, canonicalization, entry hash, previous hash, sequence continuity, ledger identity, receipt references, signature/trust policy, unsupported versions (reject, never silent-accept), duplicate entries, genesis validity. Returns structured findings, never just exit code:

```ts
interface LedgerValidationReport {
  valid: boolean;
  ledgerId: string;
  entriesChecked: number;
  headHash?: string;
  findings: readonly LedgerFinding[];
}
```

### 6.9 CLI (thin adapter, no domain logic)

```text
drenyra-ledger init     --ledger audits/main.ndjson --manifest contracts/ledger-schema/v1/manifest.json
drenyra-ledger append   --ledger audits/main.ndjson --receipt receipts/EXEC-001.json --idempotency-key EXEC-001
drenyra-ledger validate --ledger audits/main.ndjson --trust-root contracts/receipt-schema/v1/dev-keys.json [--json]
drenyra-ledger inspect  --ledger audits/main.ndjson
```

CLI flow: parse args → read inputs → invoke ledger core → render structured result. No cryptographic rules inside the command.

### 6.10 Signing policy

If `DRENYRA_LEDGER_KEY` exists: base64 PKCS8 → DER SPKI → sign canonical content; `signer_key_id` from `DRENYRA_LEDGER_KEY_ID` or `dev-ledger-key`. Otherwise `signer_key_id: "hash-only"`, no signature fields. Production must never depend on TEST-ONLY keys.

### 6.11 Cross-language gate

Canonical implementation in TS; schemas language-agnostic; at least ledger vectors consumable by Go/Python (PR7 may add secondary validators).

### 6.12 Rejection conditions

- entries editable in prior lines; hash depends on pretty-print; sequence uses timestamp; append skips expected-head check; receipt referenced by path only; validate stops at first error; CLI contains domain logic; unknown version silently accepted; TEST-ONLY keys in production.

## 7. Failure and security boundaries

- Missing canonical fixtures fail; no harness skips conformance.
- Invalid base64, malformed DER, wrong key type, or invalid signature becomes a verification failure, not a crash.
- Generator refuses key files without TEST-ONLY classification and never reads operational key variables.
- Ledger append never repairs or truncates a damaged chain.
- Ledger private keys are environment-only, never logged or written, and optional.
- Append-only correction uses a later `FIXED`, `AMENDED`, or `RETIRED` entry; history is not rewritten.
- Synthetic fixture identifiers never contain real RUC, company, fiscal document, or credential data.

## 8. File-change inventory

- Contracts and generator: `contracts/receipt-schema/v1/**`, `scripts/conformance/generate-receipt-vectors.ts`.
- TS tests/dependencies: conformance tests, `packages/mission-domain/package.json`, `bun.lock`.
- Go: `receipt_signature.go`, new conformance test, additive legacy fixture update.
- Python: conformance helper/test, `apps/data-engine/pyproject.toml`, `apps/data-engine/uv.lock`.
- CI: `.github/workflows/contracts-nightly.yml`.
- Audit: `docs/audits/**`, `scripts/audit/**`.

No API, web, database, fiscal calculation, tenant query, or production receipt behavior changes.

## 9. Suggested implementation order

1. Add failing TS schema/fixture tests, test dependencies, schemas, manifest, and README.
2. Add failing determinism test, fixed dev keys, generator, and eight committed vectors; prove frozen legacy bytes and metadata exclusion.
3. Add failing TS local/trusted conformance tests, then complete mappings.
4. Add failing Go conformance test, then the two struct fields and two legacy metadata fields; run all Go tests.
5. Add failing Python tests, dev crypto dependency/lock, then the helper.
6. Extend CI with the isolated drift-guard job and validate workflow syntax/commands.
7. Add failing ledger tests for genesis, append, tamper rejection, signature checks, vocabularies, IDs, and atomic no-write; then schemas/core/CLIs/docs and CLI-created ledgers.
8. Run all three harnesses and regressions; only then append the invariant `VERIFIED` entry and validate both ledgers.

Tasks should forecast chained PR boundaries between contracts/vectors, language harnesses, and ledger/CI if any slice approaches the configured 400-line review budget.

## 10. Apply/verify evidence

- TS conformance, schema, and generator tests pass, including exact trusted statuses and committed-byte regeneration.
- `go test ./...` passes under `apps/cli`; metadata round-trips and canonical fixtures cannot be skipped.
- `uv run pytest tests/conformance` passes under `apps/data-engine` with frozen lock resolution.
- Audit unit tests pass; both validator entry points accept committed ledgers; tamper tests prove no-write behavior.
- All REQ-REG-001 suites remain green.
- Legacy signed receipt hash/signature are byte-for-value unchanged; only two metadata fields are added.
- The workflow exposes an isolated three-surface conformance job for relevant changes.

## 11. Risks and mitigations

- **Completion-vector conflict**: D6 selects metadata-only variation, compatible with the unavailable private key and frozen signature.
- **Ajv format behavior**: use Ajv 8-compatible `ajv-formats` and strict compilation.
- **Python environment drift**: dev-only lock-backed dependency and CI `--frozen`.
- **Path brittleness**: source-relative root resolution in every language.
- **Ledger schema versus chain semantics**: JSON Schema owns shape; one TS core owns cryptographic and ordering checks.
- **Review size**: tasks must split delivery when the 400-line forecast is exceeded.
