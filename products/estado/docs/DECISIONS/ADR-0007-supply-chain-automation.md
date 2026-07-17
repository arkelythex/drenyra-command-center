# ADR-0007: Supply-chain security automation baseline

## Status
Accepted

## Decision
Adopt automated dependency management and security scanning with:
- Dependabot (actions, cargo, npm)
- CodeQL (Rust and JavaScript/TypeScript)
- Secret scanning (gitleaks)
- SBOM + vulnerability scanning (CycloneDX + Grype)

## Why
Open-source projects require continuous and auditable security posture,
not ad-hoc or manual-only checks.

## Consequences
- More CI signals to triage regularly.
- Better visibility into dependency and secret risk.
- Clear baseline for security governance and incident response.
