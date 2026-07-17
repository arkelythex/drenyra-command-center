# Governance

## Mission
Build public-interest civic technology for Peru with auditability, privacy, and operational reliability by default.

## Scope
This governance applies to code, docs, release process, issue triage, and security handling.

## Roles
- Project Lead: final call on architecture, security posture, and release decisions.
- Maintainers: own day-to-day reviews and module stewardship.
- Contributors: submit issues, RFCs, and PRs under project standards.

## Decision process
- Small changes: normal PR review with CODEOWNERS approval.
- Significant changes: RFC required (`docs/RFCS/`) and linked from PR.
- Architecture changes: ADR update required (`docs/DECISIONS/`).
- Security/privacy-impacting changes: must include threat/risk note in PR.
- Admin/moderation capability changes must update auth/RBAC docs and tests.

## RFC policy
Use RFC when a change affects one of the following:
- public API contracts
- data model/migrations
- authn/authz model
- privacy/retention behavior
- module boundaries or deployment topology

Process:
1. Open RFC issue using the RFC template.
2. Submit RFC markdown in `docs/RFCS/`.
3. Allow at least 5 calendar days for comments.
4. Maintainers decide: accept, revise, or reject.

## Release and branch policy
- `main` is protected and requires passing CI + CODEOWNERS review.
- No direct pushes to `main`.
- Use trunk-based development with short-lived branches.
- PR titles and commit headers follow Conventional Commits.
- Security workflows (CodeQL, secret scan, SBOM scan) must remain enabled.
- Releases are managed by automated release PRs (`release-please`).
- Operations docs (SLO/runbook/incident) must stay current with behavior changes.

## Conduct and enforcement
- Community behavior follows `CODE_OF_CONDUCT.md`.
- Security disclosure follows `SECURITY.md`.

## Amendments
Governance changes require PR approval by Project Lead and at least one Maintainer.
