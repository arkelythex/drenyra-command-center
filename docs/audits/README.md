# Drenyra Audit Ledgers

**Last updated**: 2026-08-01

Append-only, cryptographically chained record of Drenyra engineering changes and
invariants — the development side of RED (Receipt-Driven Execution). Every entry
is a canonical NDJSON line; history is never edited, deleted, or rewritten. Only
append, supersede, revoke, and compensate exist.

## Purpose

- **Change ledger** records what changed and which receipt backs it.
- **Invariant ledger** records engineering invariants and when they were
  established or verified.
- Both share one canonical format and one hash chain so `validate` is uniform.

## Entry format

One canonical entry per line (NDJSON). Entry fields (design §6):

```text
entryId            stable uuid — global identity (never the position)
ledgerId           ledger name — identity of the chain
sequence           monotonic position in the ledger (1-based, never a timestamp)
previousEntryHash  link to the previous entry (GENESIS: SHA-256 of empty string)
entryType          vocabulary below
payloadHash        SHA-256 of the canonical entry payload
receiptHash        SHA-256 of the backing receipt content (GENESIS: empty hash)
occurredAt         RFC 3339 — when the fact happened
recordedAt         RFC 3339 — when it was appended
actor              who recorded it
schemaVersion      ledger schema version
signerKeyId        "hash-only" or the key id that signed the entry
```

## Hash chain (design §6.5)

```text
entryHash =
  H(canonicalHeader || payloadHash || receiptHash || previousEntryHash)

canonicalHeader = sorted-keys compact JSON of
  { ledgerId, sequence, entryType, occurredAt, recordedAt, actor, schemaVersion, entryId }
```

Canonicalization is the exact sorted-keys serialization validated across
TypeScript, Go, and Python in `contracts/receipt-schema/v1` conformance — there
is no second representation.

## Entry types (design §6.3)

| Type | Meaning |
| --- | --- |
| `GENESIS` | Ledger bootstrap — fixes protocol, hash, trust root, policy |
| `RECEIPT_RECORDED` | A signed receipt was recorded as backing evidence |
| `ATTESTATION_ADDED` | An attestation was attached to a receipt/entry |
| `ENTRY_SUPERSEDED` | A prior entry was superseded (history preserved) |
| `ENTRY_REVOKED` | A prior entry was revoked (history preserved) |
| `CHECKPOINT_CREATED` | Periodic head checkpoint |

## CLI (design §6.9)

```bash
drenyra-ledger init     --ledger audits/main.ndjson --manifest <manifest.json>
drenyra-ledger append   --ledger audits/main.ndjson --receipt <receipt.json> --idempotency-key <key>
drenyra-ledger validate --ledger audits/main.ndjson [--trust-root <keys.json>] [--json]
drenyra-ledger inspect  --ledger audits/main.ndjson
```

The CLI is a thin adapter: parse args → read inputs → invoke the core → render
results. No cryptographic rules live in the command.

## Signing (design §6.10)

- Default: `signerKeyId: "hash-only"`, no signature fields — integrity by chain.
- Signed mode: set `DRENYRA_LEDGER_KEY` (base64 PKCS8) and optionally
  `DRENYRA_LEDGER_KEY_ID`; entries get Ed25519 signatures over the canonical
  content.
- Dev keys in `contracts/receipt-schema/v1/fixtures/dev-keys.test-only.json`
  are **TEST-ONLY** — never use them for production ledgers.

## Ledgers

- `data/main.ndjson` — the canonical engineering audit ledger.
- `schemas/ledger-entry.schema.json`, `schemas/ledger-manifest.schema.json` —
  draft-07 validation schemas.

## Verify

```bash
drenyra-ledger validate --ledger docs/audits/data/main.ndjson
```

Any schema, canonicalization, hash, linkage, sequence, identity, receipt,
signature, or version finding returns non-zero with structured diagnostics.
