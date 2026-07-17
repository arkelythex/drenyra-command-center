# Roadmap Milestones v1

## Milestone M0: Foundation (completed baseline)
- Governance, ADR/RFC process, security baseline, quality gates.
- Monorepo bootstrap and runnable local stack.

## Milestone M1: Dual-MVP execution
- MVP-A ingest + read models reliable for municipal data.
- MVP-B report workflow with evidence, verification, publication.
- Smoke tests and contributor onboarding stable.

## Milestone M2: Pilot municipality
- One municipality pilot using localize pack.
- Operational runbooks for moderation and incidents.
- Baseline SLO dashboards.
- Alert routing and on-call rotation active.
- Prometheus + Grafana local parity stack available for contributors.

## Milestone M3: Multi-municipality replication
- Multiple municipality packs and deployment playbook.
- Regional brigade enablement model and maintainer rotation.
- Release cadence and support model documented.

## Milestone M4: Public-good hardening
- Strong authn/authz for admin and moderation.
- Privacy/compliance audit cycle.
- Public reliability and transparency reports.
- OIDC/Keycloak + RBAC baseline active for protected API paths.
- Local Keycloak validation and RBAC smoke checks integrated in contributor flow.
- OIDC RBAC integration workflow active in CI with auth metrics and alerts.
- Domain SLO metrics (workflow + ingest) and observability asset CI validation active.
- Workflow-B HTTP transition checks (valid + invalid `409`) active in integration pipeline.
