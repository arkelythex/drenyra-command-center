# Supply Chain Security v1

## Automation baseline
- Dependabot updates for GitHub Actions, Cargo, and npm.
- CodeQL static analysis for Rust and JavaScript/TypeScript.
- Secret scanning with gitleaks on push, PR, and weekly schedule.
- SBOM generation (CycloneDX) and vulnerability scan (Grype).

## Workflow files
- `.github/dependabot.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/secret-scan.yml`
- `.github/workflows/sbom.yml`

## Governance requirements
- Security-relevant dependency updates must be prioritized.
- High/Critical findings require triage within 48 hours.
- Fixes must include risk notes in PR and changelog entries when applicable.

## Manual controls
- Review third-party additions in PRs.
- Prefer minimal dependency footprint.
- Pin action major versions and review upstream changelogs.
- Rotate credentials/secrets on incident suspicion.
