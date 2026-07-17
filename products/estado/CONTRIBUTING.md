# Contributing

## Principles
- Non-partisan, public-interest
- Respect privacy and safety
- Build auditable systems

## Workflow
- Open an Issue (problem/proposal/RFC)
- Discuss scope and metrics
- Create small, reviewable PRs
- Use ADRs for architecture decisions
- Use RFCs for major decisions (`docs/RFCS/`)
- Follow CODEOWNERS approvals before merge

## Quality bar
- Tests for domain rules
- Security review for flows touching PII/evidence
- Clear docs for operators and maintainers

## Required references
- Governance rules: `GOVERNANCE.md`
- Maintainer ownership: `MAINTAINERS.md`
- Security policy: `SECURITY.md`
- Code of conduct: `CODE_OF_CONDUCT.md`
- Contributor onboarding: `CONTRIBUTOR_GUIDE.md`

## Pull request requirements
- Link issue or RFC when scope is non-trivial.
- Update OpenAPI/ADR/docs when behavior or contracts change.
- Include risk notes for privacy/security-impacting changes.
- Use Conventional Commit style so release notes are generated correctly.
- For auth/RBAC changes, update `docs/SECURITY/AUTH_ACCESS_CONTROL_v1.md`.

## Quality gates
- Install hooks locally: `pnpm hooks:install`
- Follow quality baseline: `docs/ENGINEERING_QUALITY.md`
- Use Conventional Commit headers (validated by commit hook and PR title check)
- Validate golden paths before major merges: `pnpm smoke:e2e`
- For auth-sensitive changes, run OIDC smoke: `pnpm keycloak:wait && pnpm smoke:rbac`
- See release process: `docs/RELEASE_ENGINEERING.md`
- For reliability-impacting changes, update runbooks/SLO docs in `docs/OPERATIONS/`
