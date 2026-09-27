# Slice 0 External Accounting Release Verification

## Result: `unavailable`

`verified` requires a complete release/integrity/compatibility binding; `rejected` means inspected evidence proves incompatibility or invalid integrity; `unavailable` means required proof cannot be established. No locally available evidence is sufficient to mark an external accounting runtime as a verified Command Center authority provider.

| Candidate | Locally inspected facts | Verification status | Missing authority proof |
| --- | --- | --- | --- |
| `vendored/drenyra-ai-0.2.0.tgz` | tracked file; SHA-256 `1c06f20993ee5ced0f7e7efb7448bdc335abf49c9a980d894ea4fc0a7387164c`; package says `drenyra-ai@0.2.0`, exports missions/ledger/receipts/gates/recovery; mission-domain depends on it | unavailable | no locally bound publisher signature/attestation, release manifest, host compatibility range, authority scope, or full accounting TCK record |
| `vendored/drenyra-ai-0.4.1.tgz` | tracked file; SHA-256 `ae96d8441ab5b52f1e5bdfcc5e18de89c2435e6cf9ddadc80adfe8b39b128be7`; package says `drenyra-ai@0.4.1`, broader fiscal/journal/tenant/guardian exports; Pi depends on it | unavailable | same gaps; no verified adapter binding or compatibility evidence for Command Center |

Local docs describe the tarballs as GitHub Release artifacts, and receipt/protocol tests pass against installed code. Those are useful provenance leads and conformance vectors, but prose, repository source, package metadata, local hashes, installed `node_modules`, tests, and mocks are not independently sufficient release-authority proof under the specification.

No provider endpoint, ABI, capability set, authority transfer, Money/rounding contract, RUC ownership contract, approval contract, receipt continuity policy, or failure semantics were invented. No mock or local source was promoted to production authority.

## Required verification record before activation

A future verifier must bind provider identity/version to a released artifact, publisher/integrity evidence, explicit host/contract compatibility range, authority scope, immutable evidence references, and accounting TCK results. Until that record returns `verified`, the accounting adapter must be unavailable and authoritative mutations blocked.

Audit command: enumerate `vendored/*.tgz`, run `sha256sum`, and extract only `package/package.json` with `tar -xOf`; targeted `rg` located local release claims and package consumers. No network lookup was performed.
