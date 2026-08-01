# ENGINE-QUALITY-GENTLEAI — Specification (análisis)

**Change**: `engine-quality-gentleai`
**Última actualización**: 2026-08-01
**Type**: New capability spec (no existing canonical spec for engineering-quality contracts)
**Artifact store**: hybrid (openspec + engram)

---

## Purpose

Bring Drenyra's engineering ecosystem to the structural quality standard of `Gentleman-Programming/gentle-ai`: versioned receipt contracts with cross-language conformance fixtures, and an audit trail backed by data ledgers with RED-style receipts. This spec defines WHAT must be true after Phase A (this change) — it does not prescribe implementation. It gives `design`/`tasks`/`apply`/`verify` an unambiguous contract to execute against.

## Scope

### In Scope

1. **Versioned receipt contracts** — `contracts/receipt-schema/v1/` with canonical JSON schemas + conformance fixtures for `SignedReceipt` (hash + Ed25519 + security metadata from M4.2), shared across TS/Go/Python surfaces.
2. **Conformance harness** — fixture-driven tests in TS (mission-domain), Go (CLI harness), and Python (data-engine) validating the same canonical vectors.
3. **Audit ledger foundation** — `docs/audits/` with `data/change-ledger.json`, `data/invariant-ledger.json`, and `scripts/audit/` tooling that appends receipt-backed entries and validates the hash chain.

### Out of Scope (Non-Goals)

- `@drenyra/pi` / `@drenyra/memory` stabilization (Phase B).
- Repository split into drenyra-harness / drenyra-pi / drenyra-memory (Phase C).
- Bench suite (Phase D).
- Backfilling historical audit entries — ledgers start fresh, forward-only.
- Moving packages out of the monorepo.
- **Changing receipt payload hashing** — `receiptHash` semantics and all existing hash values are frozen (would break Go fixtures and M4.2 conformance).

---

## 1. Canonical Sources of Truth

| Concern | Source | Path |
| --- | --- | --- |
| `SignedReceipt`, `ReceiptContent`, hashing, signing, local + trusted verification | TypeScript (authoritative) | `packages/mission-domain/src/mission-receipt.ts` |
| `ReceiptType` enum | mission-protocol | `packages/mission-protocol/src/types.ts` |
| Go local verification parity | Go harness | `apps/cli/internal/harness/receipt_signature.go` |
| Existing fixtures (legacy) | repo fixtures | `fixtures/receipts/*.json` |
| Existing canonical JSON vectors (hash-only surface) | Go fixture suite | `fixtures/canonicalization-vectors.json` |
| Existing audit-hash primitives | domain package | `packages/domain/src/audit-ledger/` (`computeAuditHash`, `HashChain`) |

The TypeScript `SignedReceipt` shape is the authoritative contract. The JSON schemas in `contracts/receipt-schema/v1/schemas/` MUST be generated against it, and the Go/Python surfaces MUST verify the same canonical vectors.

---

## 2. Versioned Receipt Contracts — `contracts/receipt-schema/v1/`

### 2.1 Layout

Mirror the gentle-ai `contracts/<contract>/v1/schemas/ + fixtures/` pattern (existing precedent: `contracts/data-engine/v1/manifest.json`):

```text
contracts/receipt-schema/v1/
├── manifest.json                  # contract metadata (mirrors data-engine/v1 pattern)
├── README.md                      # contract version notes, key formats, canonicalization rules
├── schemas/
│   ├── receipt-content.schema.json
│   ├── signed-receipt.schema.json
│   └── signing-key-info.schema.json
└── fixtures/
    ├── conformance-vectors.v1.json   # canonical vector suite (single file)
    └── dev-keys.test-only.json       # committed TEST-ONLY dev key pair(s) for vector generation
```

### 2.2 `SignedReceipt` schema (top-level)

`contracts/receipt-schema/v1/schemas/signed-receipt.schema.json` MUST validate exactly the TS `SignedReceipt` from `mission-receipt.ts`:

| Field | Type / Constraint | Required | Notes |
| --- | --- | --- | --- |
| `protocolVersion` | string | yes | `"1.0"` for v1 |
| `receiptType` | enum: `APPROVAL` \| `EXECUTION` \| `COMPLETION` \| `EXTERNAL_SUBMISSION` | yes | From `ReceiptType` (mission-protocol); bundle metadata — **excluded from hashing** |
| `algorithm` | const `"Ed25519"` | yes | Fixed literal |
| `content` | object (ReceiptContent) | yes | See §2.3 |
| `receiptHash` | string, pattern `^[0-9a-f]{64}$` | yes | SHA-256 hex of canonical content |
| `signerKeyId` | string | yes | Stable key identifier |
| `signerPublicKey` | string | yes | base64 DER SPKI (Ed25519) |
| `signature` | string | yes | base64 raw Ed25519 signature (64 bytes → 88 base64 chars) |
| `issuedAt` | string (RFC 3339) | yes | Issuance timestamp |

No additional properties. The schema MUST NOT require fields that the TS type does not have, and MUST NOT omit fields the TS type has.

### 2.3 `ReceiptContent` schema

`contracts/receipt-schema/v1/schemas/receipt-content.schema.json` MUST validate exactly the TS `ReceiptContent`:

| Field | Type / Constraint | Required |
| --- | --- | --- |
| `missionId` | string | yes |
| `companyId` | string | yes |
| `actorId` | string | yes |
| `decision` | enum: `APPROVE` \| `REJECT` | yes |
| `proposalVersion` | integer ≥ 0 | yes |
| `evidenceHash` | string | yes |
| `previousStatus` | string | yes |
| `newStatus` | string | yes |
| `payloadHash` | string | yes |
| `timestamp` | string (RFC 3339) | yes |

### 2.4 Signing-key info schema (trusted surface)

`contracts/receipt-schema/v1/schemas/signing-key-info.schema.json` MUST validate the TS `SigningKeyInfo`: `keyId` (string), `publicKey` (string, base64 DER SPKI), `issuedAt` (RFC 3339), optional `expiresAt` (RFC 3339), optional `revokedAt` (RFC 3339).

### 2.5 Canonicalization and hashing rules (frozen)

These rules are normative and MUST NOT change in this phase:

1. **Canonical serialization** (`sortedStringify`): object keys sorted alphabetically; compact JSON (no whitespace); arrays serialized in order; `proposalVersion` serialized as a JSON integer (`3`, never `3.0`). This is the exact `sortedStringify` semantics of `mission-receipt.ts`, mirrored by Go `sortedStringify` and by Python `json.dumps(obj, sort_keys=True, separators=(",", ":"))`.
2. **`receiptHash`** = lowercase hex SHA-256 over the canonical serialization of `content` **only**. `protocolVersion`, `receiptType`, `algorithm`, `signerKeyId`, `signerPublicKey`, `signature`, `issuedAt`, `receiptHash` itself are NEVER part of the hash.
3. **Signature payload** = the exact canonical serialization bytes (UTF-8) of `content` — identical to the string that is hashed. This is what makes signatures cross-language stable.
4. **Key formats**: public key = base64 DER SPKI (Ed25519 OID 1.3.101.112); private key = base64 DER PKCS8; signature = base64 raw Ed25519 (64 bytes).

### 2.6 Verification status model (shared vocabulary)

The canonical vector suite uses one status enum, aligned to the TS trusted pipeline and mapped to local verification:

| Status | Meaning | Local mapping (`valid`, `hashValid`, `signatureValid`) |
| --- | --- | --- |
| `SIGNER_TRUSTED` | full trusted pass | `valid=true` |
| `VALID` | local-only pass (hash + signature) | `valid=true` |
| `UNKNOWN_SIGNER` | hash+sig valid, key not recognized / public key mismatch | `valid=true` |
| `KEY_EXPIRED` | hash+sig valid, key not current | `valid=true` |
| `KEY_REVOKED` | hash+sig valid, key revoked | `valid=true` |
| `CONTENT_VALID` | hash valid, signature invalid | `valid=false`, `hashValid=true`, `signatureValid=false` |
| `PAYLOAD_TAMPERED` | hash invalid | `valid=false`, `hashValid=false` |

Surfaces that only implement local verification (Go, Python) MUST assert the `receiptHash`/`signatureValid` booleans and the local equivalence mapping above. Trusted-only statuses are asserted by surfaces implementing `verifySignedReceiptTrusted` (TS mandatory).

---

## 3. Canonical Conformance Vectors

### 3.1 Vector suite format

`contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json` MUST follow this envelope (mirrors the existing `fixtures/canonicalization-vectors.json` suite precedent):

```json
{
  "contract": "receipt-schema",
  "version": "v1",
  "vectors": [
    {
      "name": "receipt-valid-approval",
      "description": "Valid signed receipt, trusted signer key present",
      "receipt": { "protocolVersion": "1.0", "receiptType": "APPROVAL", "algorithm": "Ed25519", "content": { ... }, "receiptHash": "...", "signerKeyId": "...", "signerPublicKey": "...", "signature": "...", "issuedAt": "..." },
      "trustedKeys": [ { "keyId": "...", "publicKey": "...", "issuedAt": "..." } ],
      "vectors": {
        "receiptHash": "250df62b...",
        "signatureValid": true,
        "status": "SIGNER_TRUSTED"
      }
    }
  ]
}
```

Semantics of `vectors`:

- `receiptHash` (string): the expected SHA-256 hex that `generateReceiptHash(receipt.content)` MUST produce. Every harness computes it fresh from `content` and compares. This is the cross-language canonicalization determinism check.
- `signatureValid` (boolean): the expected Ed25519 verification result over the canonical payload with the embedded `signerPublicKey`.
- `status` (string): the expected verification status per §2.6. For non-tampered vectors, `receipt.receiptHash` MUST equal `vectors.receiptHash` (self-consistency); for `PAYLOAD_TAMPERED` vectors, `receipt.receiptHash` is intentionally stale (computed over the pre-tamper content).
- `trustedKeys`: optional array of `SigningKeyInfo`. When present and non-empty, trusted-capable surfaces run `verifySignedReceiptTrusted` and MUST assert `status` exactly. Local-only surfaces ignore it (they still assert the local mapping, which is `valid=true` for all trusted statuses).

### 3.2 Required vector set (generated once, committed static)

| # | name | Key | Expected `status` | Proves |
| --- | --- | --- | --- | --- |
| 1 | `receipt-valid-approval` | `key_test_001` (existing fixture) | `SIGNER_TRUSTED` | Valid bundle; content/hash/signature byte-identical to the existing `receipt-signed-valid.v1.json` (plus `receiptType`/`algorithm`); trusted key resolves |
| 2 | `receipt-valid-completion` | `key_test_001` | `SIGNER_TRUSTED` | `receiptType: COMPLETION` changes nothing in the hash — metadata excluded from hashing |
| 3 | `receipt-tampered-hash` | `key_test_001` | `PAYLOAD_TAMPERED` | Content mutated after signing (e.g., `evidenceHash`), stale `receiptHash` |
| 4 | `receipt-invalid-signature` | `key_test_001` | `CONTENT_VALID` | Content/hash intact, signature bytes garbled |
| 5 | `receipt-wrong-signer` | `key_test_001` sig + `key_dev_001` public key | `CONTENT_VALID` | Hash intact, signature fails against replaced public key |
| 6 | `receipt-unknown-signer` | `key_dev_001` | `UNKNOWN_SIGNER` | Hash+sig valid; `trustedKeys` does not contain the signer |
| 7 | `receipt-key-expired` | `key_dev_002` (expiresAt in the past) | `KEY_EXPIRED` | Trusted key lifecycle expiry |
| 8 | `receipt-key-revoked` | `key_dev_003` (revokedAt in the past) | `KEY_REVOKED` | Trusted key revocation |

### 3.3 Deterministic generation

- Vectors MUST be generated **once** with a committed generator script (e.g., `scripts/conformance/generate-receipt-vectors.ts`) using **fixed** dev key pairs and **fixed** timestamps (never `new Date()`).
- Ed25519 signing is deterministic: re-running the generator with the same keys and content MUST produce byte-identical fixtures (same hashes, same signatures).
- Dev key pairs (`key_dev_001..003`) and the generator SHALL be committed as **test-only** material under `contracts/receipt-schema/v1/fixtures/dev-keys.test-only.json` (marked TEST-ONLY in a header comment/field). The existing `key_test_001` public key is already public in the repo; its private key is not required for generation of the negative/trust vectors, which use the new dev keys.
- Regeneration is a maintenance operation, not a routine test step; a regeneration drift (hash/signature change) MUST fail CI review.

### 3.4 Fixture / legacy migration rules

- `fixtures/receipts/receipt-signed-valid.v1.json` currently **lacks** `receiptType` and `algorithm`. It MUST gain `"receiptType": "APPROVAL"` and `"algorithm": "Ed25519"` (additive change; `receiptHash`, `signature`, and all content values stay identical — metadata is not hashed, so no hash changes). Existing Go tests (`TestGoldenReceiptFixtures`, `TestVerifySignedReceiptLocally`) keep passing: Go `json.Unmarshal` ignores unknown fields.
- `fixtures/receipts/receipt-valid.v1.json` and `receipt-tampered.v1.json` are **content+hash envelopes** for the legacy `VerifyReceiptLocally` surface, not `SignedReceipt` bundles — they are NOT migrated to `receiptType`/`algorithm` and remain as-is. The canonical suite's vectors #3–#8 provide the signed-bundle negative cases that the legacy fixtures do not cover.
- `apps/cli/internal/harness/receipt_signature.go` `SignedReceipt` struct currently **lacks** `ReceiptType` and `Algorithm` fields. It MUST be extended (additive) with `ReceiptType string \`json:"receiptType"\`` and `Algorithm string \`json:"algorithm"\`` so the Go surface round-trips the canonical schema. No existing field, tag, or verification behavior changes.
- No payload-hash values change anywhere in this phase.

---

## 4. Conformance Harness by Surface

### 4.1 TypeScript — `packages/mission-domain/src/__tests__/conformance/`

- New vitest suite, e.g. `receipt-conformance.test.ts`, reading `contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json`.
- For each vector:
  - assert `generateReceiptHash(receipt.content) === vectors.receiptHash`;
  - run `verifySignedReceipt(receipt)` and assert `signatureValid` and the local status mapping (§2.6);
  - when `trustedKeys` is present, build a `KeyTrustResolver` from it, run `verifySignedReceiptTrusted(receipt, resolver)`, and assert `status` exactly.
- When `trustedKeys` is absent, assert the vector's `status` against the local mapping only.
- The suite MUST also validate every vector's `receipt` against the JSON schemas (§4.4).

### 4.2 Go — `apps/cli/internal/harness/receipt_conformance_test.go`

- New test reading the same canonical suite file (path resolved from the repo root; reuse/extend `findFixturesRoot` logic or add an equivalent for `contracts/`).
- For each vector: `ParseSignedReceipt`, then `VerifySignedReceiptLocally`, asserting `SignatureValid` equals `vectors.signatureValid`, computed content hash equals `vectors.receiptHash`, and the local status mapping. Also assert `receipt.ReceiptType` and `receipt.Algorithm` round-trip (struct extension per §3.4).
- Go asserts the local surface only; `status` is checked only for the local-equivalence statuses (`VALID`, `CONTENT_VALID`, `PAYLOAD_TAMPERED`); trusted-only statuses require `Valid == true`.
- `go test ./...` under `apps/cli` MUST remain green (17 packages).

### 4.3 Python — `apps/data-engine`

- Location: conformance module under `apps/data-engine` (e.g., `src/conformance/receipt_canonical.py` helper + `tests/conformance/test_receipt_conformance.py` pytest suite). `packages/conformance` does not exist; data-engine is the Python surface.
- The module MUST implement, in pure Python: (1) canonical serialization (`json.dumps(obj, sort_keys=True, separators=(",", ":"))`), (2) SHA-256 hex over canonical content, (3) Ed25519 verification over the canonical payload bytes with the embedded public key.
- Neither `cryptography` nor `PyNaCl` is currently declared in `apps/data-engine/pyproject.toml`. The harness requires exactly one of them (`cryptography` preferred for SPKI parsing ergonomics); it MUST be added to the **dev** dependency group only (`uv.lock` updated). Existing data-engine tests MUST stay green (pytest, `testpaths = ["tests"]`).
- The suite reads the same canonical vector file, asserts `receiptHash`, `signatureValid`, and the local status mapping. `status` asserts use the same local-equivalence rule as Go.

### 4.4 Schema validation

- A TS test (in the mission-domain conformance suite or a dedicated `contracts/receipt-schema/v1` test) MUST validate:
  - every vector's `receipt` against `signed-receipt.schema.json`;
  - every `trustedKeys` entry against `signing-key-info.schema.json`;
  - `receipt.content` against `receipt-content.schema.json`.
- Validator: JSON Schema draft-07 via a standard validator (ajv recommended); exact dependency is a design/tasks decision.

### 4.5 CI conformance job

- A CI job MUST run all three surfaces against the same committed fixtures: TS (`bun run --filter @drenyra/mission-domain test`), Go (`go test ./...` in `apps/cli`), Python (`uv run pytest` conformance suite in `apps/data-engine`).
- This job is the cross-language drift guard from the proposal's risk table. It MAY extend the existing `contracts-nightly.yml` (already TS–Python with Bun+uv) or be a new workflow — design's call.

---

## 5. Audit Ledger Foundation

### 5.1 Layout

```text
docs/audits/
├── README.md                      # ledger purpose, schema, append/validate usage (docs-as-code; Last updated line)
└── data/
    ├── change-ledger.json         # every material engineering change of this phase
    └── invariant-ledger.json      # invariants established/verified (e.g., cross-language hash determinism)
scripts/audit/
└── append-ledger.ts               # append + validate CLI (bun)
```

### 5.2 Ledger entry schema (identical for both ledgers)

```json
{
  "id": "change-0001",
  "timestamp": "2026-08-01T00:00:00.000Z",
  "actor": "el-gentleman",
  "change_type": "ADDED",
  "description": "Canonical receipt schemas under contracts/receipt-schema/v1/schemas/",
  "receipt_hash": "64-char lowercase hex",
  "signer_key_id": "dev-ledger-key",
  "prev_hash": null
}
```

| Field | Type | Required | Semantics |
| --- | --- | --- | --- |
| `id` | string | yes | Unique, stable, monotonically increasing within a ledger; default format `<ledger-prefix>-<zero-padded seq>` (`change-0001`, `invariant-0001`) |
| `timestamp` | string (RFC 3339 UTC) | yes | Entry time |
| `actor` | string | yes | Operator/agent identity |
| `change_type` | string | yes | Controlled vocabulary, see §5.5 |
| `description` | string | yes | Human-readable summary |
| `receipt_hash` | string (`^[0-9a-f]{64}$`) | yes | RED-style hash over canonical entry content, see §5.3 |
| `signer_key_id` | string | yes | Key id used for the optional signature; literal `"hash-only"` when unsigned |
| `prev_hash` | string \| null | yes | Previous entry's `receipt_hash`; `null` for the genesis entry |
| `signature` | string | no (signed mode) | base64 Ed25519 over canonical entry content bytes |
| `signer_public_key` | string | no (signed mode) | base64 DER SPKI of the dev key (so the ledger is externally verifiable) |

### 5.3 Hash-chain rules (normative)

1. **Entry content** = `{ id, timestamp, actor, change_type, description }`.
2. **`receipt_hash`** = lowercase hex SHA-256 over the canonical serialization of entry content, using the SAME canonicalization as receipt hashing (§2.5: key-sorted, compact, integers as numbers). This is a RED-style receipt over the entry, not the receipt `sortedStringify` re-implemented differently — one canonicalization, one implementation.
3. **Chain rule**: `entry[0].prev_hash === null` (genesis); for `i > 0`, `entry[i].prev_hash === entry[i-1].receipt_hash`.
4. **Validation** (validate command and every append): recompute each entry's `receipt_hash` from its fields; verify the chain rule; verify `receipt_hash` format. Any mismatch ⇒ non-zero exit, no write.
5. **Signature (signed mode, optional)**: Ed25519 over the canonical entry-content bytes; requires a dev private key available via environment (e.g., `DRENYRA_LEDGER_KEY`, base64 PKCS8). When no key is configured, entries are hash-only (`signer_key_id: "hash-only"`, `signature`/`signer_public_key` absent). Hash-only mode MUST always work; signed mode is an enhancement that MUST NOT block appends.
6. The existing `packages/domain/src/audit-ledger/` primitives (`HashChain` VO for 64-hex validation, `computeAuditHash` as a *reference* for chain-committing semantics) MAY be reused where semantically compatible; the entry `receipt_hash` itself MUST follow the RED-style rule above (pure content hash), not `computeAuditHash`'s payload+prev concatenation — the `prev_hash` column carries the linkage.

### 5.4 `scripts/audit/append-ledger.ts` CLI contract

```text
bun run scripts/audit/append-ledger.ts --ledger change|invariant --actor <id> --change-type <vocab> --description "<text>"
bun run scripts/audit/append-ledger.ts --validate
```

- `--ledger change|invariant` (required for append): selects `docs/audits/data/{change,invariant}-ledger.json`.
- Append mode: loads the ledger (creating it with a genesis entry `prev_hash: null` when absent), validates the existing chain, computes the new entry's `receipt_hash`, appends, writes back atomically. Any chain inconsistency aborts with a clear error and no write.
- `--validate`: recomputes and checks every entry in both ledgers (hash format, per-entry hash, chain linkage, and signatures when `signer_public_key` present); exit 0 on success, 1 on any failure with per-entry diagnostics.
- Atomicity: write via temp-file + rename in the same directory; never partial JSON.
- The script runs under Bun from the repo root; importing from workspace packages is allowed.

### 5.5 Controlled vocabularies

- `change-ledger.json` `change_type`: `INIT` \| `ADDED` \| `MODIFIED` \| `FIXED` \| `REMOVED`.
- `invariant-ledger.json` `change_type`: `ESTABLISHED` \| `VERIFIED` \| `AMENDED` \| `RETIRED`.

### 5.6 Ledger initialization and content during apply

- Apply MUST initialize both ledgers via the append tool and record this phase's material events: the `contracts/receipt-schema/v1` creation (schemas + fixtures), the legacy fixture update (§3.4), each harness surface added (TS/Go/Python), the CI conformance job, and the ledger foundation itself.
- Apply MUST establish at least one invariant entry, e.g. `ESTABLISHED — "Receipt content hashing (sortedStringify + SHA-256) is byte-identical across TypeScript, Go, and Python"`, and SHOULD `VERIFIED` it after all three harnesses pass.
- No historical backfill (forward-only per proposal).

---

## 6. Requirements (normative)

### Requirement: REQ-CONTRACT-001 — Canonical receipt schema files

The system MUST provide canonical JSON schemas at `contracts/receipt-schema/v1/schemas/` (`signed-receipt.schema.json`, `receipt-content.schema.json`, `signing-key-info.schema.json`) plus `manifest.json` and a `README.md`, mirroring the `contracts/<contract>/v1/schemas/ + fixtures/` layout, with every schema validating exactly the corresponding TypeScript type in `packages/mission-domain/src/mission-receipt.ts` and `packages/mission-protocol/src/types.ts` (field-for-field, per §2.2–§2.4).

#### Scenario: Schema files exist and cover the full bundle

- GIVEN the change is applied
- WHEN `contracts/receipt-schema/v1/schemas/` is inspected
- THEN `signed-receipt.schema.json`, `receipt-content.schema.json`, and `signing-key-info.schema.json` exist
- AND `manifest.json` declares `contract: "receipt-schema"`, `version: "v1"`

#### Scenario: Schema matches the TypeScript source of truth

- GIVEN the TS `SignedReceipt` interface in `mission-receipt.ts` (including `receiptType` and `algorithm`)
- WHEN the `signed-receipt.schema.json` is compared against it
- THEN every TS field is present with matching type/constraint and no field is omitted or added
- AND `receiptType` is constrained to the `ReceiptType` enum values and `algorithm` is the literal `"Ed25519"`

### Requirement: REQ-CONTRACT-002 — Frozen hashing and signing semantics

The system MUST retain the canonicalization, hashing, and signing rules of §2.5 exactly: key-sorted compact JSON; `receiptHash` = SHA-256 hex over `content` only (bundle metadata excluded); signature over the identical canonical payload bytes; base64 DER SPKI public keys and base64 raw Ed25519 signatures. No payload-hash value existing in the repository MAY change in this change.

#### Scenario: Metadata is not hashed

- GIVEN the vector `receipt-valid-completion` whose `receiptType` is `COMPLETION` and whose content is identical to `receipt-valid-approval` except for the `missionId`
- WHEN the harness computes the content hash
- THEN `receiptHash` is unchanged by `receiptType`/`algorithm`/`protocolVersion`/`signerKeyId`/`signerPublicKey`/`signature`/`issuedAt`
- AND the hash equals SHA-256 over the canonical content only

#### Scenario: Existing hash values frozen

- GIVEN the content of the existing `fixtures/receipts/receipt-signed-valid.v1.json`
- WHEN `generateReceiptHash(content)` runs in any surface
- THEN the result is `250df62bbfcf3f1b6b54641b45da81ca50fbf679e93ee50f75939e75c7eaee59` (unchanged)

### Requirement: REQ-VECTOR-001 — Canonical vector suite

The system MUST ship a committed canonical vector suite at `contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json` with the §3.1 envelope (`name`, `description`, `receipt`, optional `trustedKeys`, `vectors: { receiptHash, signatureValid, status }`), containing at least the eight vectors of §3.2 covering valid, tampered-hash, invalid-signature, wrong-signer, unknown-signer, expired-key, and revoked-key cases, and the `receipt-valid-completion` metadata-exclusion case.

#### Scenario: Negative vectors fail local verification

- GIVEN vectors `receipt-tampered-hash`, `receipt-invalid-signature`, and `receipt-wrong-signer`
- WHEN any surface runs local verification
- THEN `receipt-tampered-hash` yields `hashValid=false` and status `PAYLOAD_TAMPERED`
- AND `receipt-invalid-signature` and `receipt-wrong-signer` yield `hashValid=true`, `signatureValid=false`, status `CONTENT_VALID`

#### Scenario: Trusted lifecycle vectors resolve exactly

- GIVEN vectors with `trustedKeys` covering known, unknown, expired, and revoked signers
- WHEN a trusted-capable surface runs `verifySignedReceiptTrusted` with a resolver built from `trustedKeys`
- THEN `status` is exactly `SIGNER_TRUSTED`, `UNKNOWN_SIGNER`, `KEY_EXPIRED`, or `KEY_REVOKED` respectively
- AND `steps` match the expected hash/signature/recognition/currency/revocation flags

### Requirement: REQ-VECTOR-002 — Deterministic generation

Vectors MUST be generated once with a committed generator using fixed test-only dev keys and fixed timestamps; regeneration with the same inputs MUST be byte-identical (hashes and signatures), because Ed25519 signing is deterministic. Dev keys SHALL be committed under `contracts/receipt-schema/v1/fixtures/dev-keys.test-only.json`, clearly marked TEST-ONLY.

#### Scenario: Regeneration is stable

- GIVEN the committed generator and dev keys
- WHEN the generator runs twice against the same fixed inputs
- THEN both runs produce identical `conformance-vectors.v1.json` bytes (same `receiptHash`, same `signature`, same `issuedAt`)

### Requirement: REQ-HARNESS-001 — TypeScript conformance surface

The mission-domain test suite MUST include a conformance test under `packages/mission-domain/src/__tests__/conformance/` that reads the canonical vector suite and, for every vector: asserts `generateReceiptHash(receipt.content)` equals `vectors.receiptHash`; asserts `verifySignedReceipt`'s `signatureValid` and local status mapping; and, when `trustedKeys` is present, asserts `verifySignedReceiptTrusted`'s `status` exactly.

#### Scenario: TS harness consumes the suite

- GIVEN `conformance-vectors.v1.json` with eight vectors
- WHEN `bun run --filter @drenyra/mission-domain test` executes the conformance test
- THEN all eight vectors pass hash, signature, and status assertions
- AND trusted vectors assert exact `verifySignedReceiptTrusted` statuses

### Requirement: REQ-HARNESS-002 — Go conformance surface

The CLI harness MUST include `apps/cli/internal/harness/receipt_conformance_test.go` reading the same canonical vector file, parsing each `receipt` with `ParseSignedReceipt`, and asserting the local surface (`VerifySignedReceiptLocally`): `SignatureValid` matches `vectors.signatureValid`, computed content hash matches `vectors.receiptHash`, and the local status mapping holds. The Go `SignedReceipt` struct MUST round-trip `receiptType` and `algorithm`.

#### Scenario: Go harness consumes the suite

- GIVEN the canonical vector file reachable from the `apps/cli` module
- WHEN `go test ./...` runs in `apps/cli`
- THEN the conformance test parses and verifies every vector
- AND `receipt.ReceiptType`/`receipt.Algorithm` are non-empty for schema-conformant receipts
- AND all 17 existing Go test packages remain green

### Requirement: REQ-HARNESS-003 — Python conformance surface

The data-engine Python surface MUST include a conformance module and pytest suite (under `apps/data-engine`) that implements canonical serialization, SHA-256 content hashing, and Ed25519 verification in Python and asserts the same vectors with the same local mapping. Exactly one crypto dependency (`cryptography` preferred) MUST be added to the dev dependency group, and existing data-engine tests MUST remain green.

#### Scenario: Python harness consumes the suite

- GIVEN `cryptography` (or `PyNaCl`) declared in the dev group and installed via uv
- WHEN `uv run pytest` executes the conformance suite
- THEN computed content hashes equal `vectors.receiptHash` for all vectors
- AND Ed25519 verification matches `vectors.signatureValid`
- AND existing non-conformance tests still pass

### Requirement: REQ-HARNESS-004 — Schema validation of fixtures

A TypeScript test MUST validate every vector's `receipt` against `signed-receipt.schema.json`, every `trustedKeys` entry against `signing-key-info.schema.json`, and every content against `receipt-content.schema.json` using a draft-07 JSON Schema validator.

#### Scenario: All fixtures are schema-conformant

- GIVEN the canonical vector suite and the three schemas
- WHEN the schema-validation test runs
- THEN every vector receipt validates with zero errors
- AND the updated legacy fixture `fixtures/receipts/receipt-signed-valid.v1.json` (with `receiptType`/`algorithm` added) also validates against `signed-receipt.schema.json`

### Requirement: REQ-HARNESS-005 — CI conformance job

CI MUST run all three conformance surfaces (TS, Go, Python) against the same committed vector suite on every relevant event, so cross-language drift fails the build.

#### Scenario: Cross-language drift is caught

- GIVEN a committed vector suite and a CI job running TS + Go + Python harnesses
- WHEN one surface would compute a different `receiptHash` for the same content
- THEN that surface's harness fails and the CI job exits non-zero

### Requirement: REQ-LEDGER-001 — Audit ledger files and schema

The system MUST provide `docs/audits/data/change-ledger.json` and `docs/audits/data/invariant-ledger.json` (plus a `docs/audits/README.md` with a Last updated line) whose entries follow the §5.2 schema (`id`, `timestamp`, `actor`, `change_type`, `description`, `receipt_hash`, `signer_key_id`, `prev_hash`, optional `signature`/`signer_public_key`), with `change_type` constrained to the §5.5 vocabularies.

#### Scenario: Ledger files exist and are valid

- GIVEN the change is applied
- WHEN `docs/audits/data/` is inspected
- THEN both ledger files exist, each an array of entries conforming to §5.2
- AND `docs/audits/README.md` documents purpose, schema, and append/validate usage

### Requirement: REQ-LEDGER-002 — Hash chain integrity

Ledger entries MUST form a tamper-evident hash chain: `receipt_hash` is the SHA-256 of the canonical entry content (same canonicalization as receipts), `entry[0].prev_hash` is `null`, and every subsequent `prev_hash` equals the previous entry's `receipt_hash`. Appends MUST validate the existing chain before writing and MUST abort (no write, non-zero exit) on any inconsistency. `--validate` MUST recompute and check every entry and linkage.

#### Scenario: Append validates the chain

- GIVEN a ledger whose last entry has `receipt_hash` `H`
- WHEN an append is attempted
- THEN the tool recomputes the last entry's hash from its fields, confirms it equals `H`
- AND writes the new entry with `prev_hash` = `H` and its own recomputed `receipt_hash`

#### Scenario: Tampered chain is rejected

- GIVEN a ledger entry whose `description` was edited after append (hash now stale)
- WHEN `--validate` runs or an append is attempted
- THEN the tool reports the offending entry id and exits non-zero without writing

### Requirement: REQ-LEDGER-003 — Append and validate CLI

The system MUST provide `scripts/audit/append-ledger.ts` supporting `--ledger change|invariant`, `--actor`, `--change-type`, `--description`, and a `--validate` mode, writing atomically (temp-file + rename), generating a genesis entry (`prev_hash: null`) when a ledger file is absent, and supporting optional signed entries via a dev key from the environment (falling back to hash-only mode without it).

#### Scenario: First append creates a genesis entry

- GIVEN no `docs/audits/data/change-ledger.json`
- WHEN `append-ledger.ts --ledger change --actor ci --change-type INIT --description "..."` runs
- THEN the file is created containing one entry with `prev_hash: null` and a valid 64-hex `receipt_hash`

#### Scenario: Signed mode is optional

- GIVEN no `DRENYRA_LEDGER_KEY` configured
- WHEN an append runs
- THEN the entry is written hash-only with `signer_key_id: "hash-only"` and no `signature`/`signer_public_key`
- AND the append still succeeds

### Requirement: REQ-LEDGER-004 — Ledgers record this phase

Apply MUST initialize both ledgers and append entries documenting this phase's material events (contracts creation, legacy fixture update, each harness surface, CI job, ledger foundation) and MUST establish at least one invariant entry (e.g., cross-language receipt-hash determinism) plus a `VERIFIED` follow-up once all three harnesses pass. No historical backfill.

#### Scenario: Invariant is established and verified

- GIVEN all three harnesses pass against the canonical suite
- WHEN invariant entries are appended
- THEN `invariant-0001` has `change_type: "ESTABLISHED"` describing cross-language receipt-hash determinism
- AND a subsequent entry has `change_type: "VERIFIED"` referencing the passing harnesses

### Requirement: REQ-REG-001 — No regression

All existing test suites MUST remain green after this change: mission-protocol (62), mission-domain (146), api (64), client (25), CLI Go (17 packages), web (67). Fixture updates and the Go struct extension are additive; no existing hash, signature, or verification behavior changes.

#### Scenario: Full regression pass

- GIVEN the change fully applied
- WHEN the full monorepo test command and `go test ./...` (apps/cli) run
- THEN all pre-existing suites pass with their historical counts
- AND the updated `fixtures/receipts/receipt-signed-valid.v1.json` still passes `TestGoldenReceiptFixtures` and `TestVerifySignedReceiptLocally`

---

## 7. Acceptance Criteria (mapped from the proposal)

| # | Proposal criterion | Spec requirements |
| --- | --- | --- |
| 1 | `contracts/receipt-schema/v1/schemas/*.json` exist and validate against TS `SignedReceipt` (incl. `receiptType`, `algorithm`, M4.2 security metadata) | REQ-CONTRACT-001, REQ-HARNESS-004 |
| 2 | Conformance fixtures in `contracts/receipt-schema/v1/fixtures/` consumed by tests in at least two languages, all green on the same vectors (TS + Go required; Python is in scope per proposal scope item 2) | REQ-VECTOR-001, REQ-HARNESS-001, REQ-HARNESS-002, REQ-HARNESS-003 |
| 3 | `docs/audits/` exists with `data/change-ledger.json` + `data/invariant-ledger.json`; `scripts/audit/` appends receipt-backed entries (hash + signer key id) and validates the hash chain | REQ-LEDGER-001, REQ-LEDGER-002, REQ-LEDGER-003, REQ-LEDGER-004 |
| 4 | All existing tests remain green (62/146/64/25/17 packages/67) | REQ-REG-001 |
| 5 | Delivery: auto-forecast, 400-line budget — chain PRs if a phase exceeds it | §8 delivery constraints (tasks/apply concern) |

---

## 8. Dependencies, Risks, and Drift

| # | Risk / dependency | Impact | Mitigation (spec-level) |
| --- | --- | --- | --- |
| 1 | **Go struct drift**: `receipt_signature.go` `SignedReceipt` lacks `receiptType`/`algorithm` | Go schema round-trip fails criterion 1 | Additive struct extension required by REQ-HARNESS-002; no existing field changes |
| 2 | **Legacy fixture drift**: `receipt-signed-valid.v1.json` lacks `receiptType`/`algorithm`; `receipt-valid.v1.json`/`receipt-tampered.v1.json` are content+hash envelopes, not bundles | Fixtures not schema-conformant; negative signed-bundle cases missing | Additive fixture update (§3.4); canonical suite adds signed negative vectors; envelopes stay as legacy surface |
| 3 | **Canonicalization parity** across languages (key sorting, compact JSON, integer `proposalVersion` never float) | Cross-language hash mismatch | Frozen rules §2.5 + shared vectors + CI job (REQ-HARNESS-005); existing `canonicalization-vectors.json` stays as a Go regression guard |
| 4 | **Python crypto dependency absent** (`cryptography`/`PyNaCl` not declared) | Python surface blocked | REQ-HARNESS-003 mandates dev-group dependency + uv.lock update; existing pytest suite unaffected |
| 5 | **Ledger schema invention** risk | Divergence from gentle-ai ledger pattern | §5 schema fixed in this spec (delegated schema: id/timestamp/actor/change_type/description/receipt_hash/signer_key_id/prev_hash + optional signature/signer_public_key); README documents it |
| 6 | **`computeAuditHash` semantic mismatch**: its payload+prev concatenation differs from RED-style pure content hash | Wrong reuse could create an unverifiable chain | §5.3 explicitly defines `receipt_hash` as RED-style content hash; `HashChain` VO reusable for format checks; `computeAuditHash` usable only as chain-committing reference |
| 7 | **Dev key availability**: `key_test_001` private key is not in the repo | Cannot re-sign the legacy vector with the same key | Vector #1 reuses the existing signature byte-for-byte; new dev keys `key_dev_001..003` committed TEST-ONLY for negative/trust vectors (§3.3) |
| 8 | **Strict TDD** (`openspec/config.yaml`: `strict_tdd: true`) | Apply must not write production code before failing tests | Design/tasks must sequence tests-first; verify phase checks it |
| 9 | **Overlap with other OpenSpec plans** (proposal-status only): `drenyra-x1-cross-stack-contracts`, `drenyra-s5-go-cli-alignment` | Future scope collisions | Out of scope here; this change owns receipts + ledgers; X1/S5 remain separate proposals |
| 10 | **`issuedAt`/timestamp nondeterminism** if generator uses `new Date()` | Regeneration churn | REQ-VECTOR-002 fixes timestamps in the generator |
| 11 | **400-line budget / chained PRs** (auto-forecast, `review_budget: 400`) | Phase may exceed single-PR budget | Delivery strategy decision belongs to tasks/apply; this change spans contracts + 3 harnesses + ledgers → forecast expects multiple PRs |

---

## 9. Delivery Constraints (informational)

- `execution_mode: interactive`, `artifact_store: hybrid` (session preflight), `strict_tdd: true`, `review_budget: 400`, `chained_pr_strategy: auto-forecast` (from `openspec/config.yaml`).
- Acceptance criterion 5 (delivery) is owned by `tasks`/`apply`: auto-forecast and chain PRs if a phase exceeds the budget. No behavioral requirement in this spec.
- After this spec, the next SDD phase is `design` (diseño). Verify phase will map its report to §7.
