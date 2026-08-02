# Releasing — Drenyra

> **Last updated:** 2026-08-01.

> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version/sequence numbers are JSON integers, never floats.

Drenyra is the mature product and follows its established release process (see the existing operation docs under `docs/13-operations/` and the repository workflows). This file is a brief pointer so the ecosystem's release expectations are stated in one place.

## Version policy

- Drenyra follows Semantic Versioning on its own release cadence.
- Releases that change consumed ecosystem contracts (`drenyra-ai`, `drenyra-engram`) are coordinated: Drenyra pins released versions and documents the upgrade in the release notes.

## Release checklist (summary)

1. Feature-complete against the planned scope.
2. Tests pass, including fiscal conformance and e2e suites.
3. Docs updated in the same PR (docs-as-code; stale docs are a bug).
4. `CHANGELOG.md` updated.
5. Conventional Commits; no AI attribution in commit messages.
6. Receipt/gate validation passes for the release.

See `docs/13-operations/` and the repository's existing release documentation for the full process.
