# Security Policy

## Reporting vulnerabilities
Report vulnerabilities privately to: `security@digitalpublic.pe` (replace with official team address).
Do not publish exploit details in public issues or pull requests.

## Supported branches
- `main`: fully supported

## Response SLA
- Acknowledgment: within 48 hours
- Initial triage: within 5 business days
- Remediation target:
  - Critical/High: as soon as possible (target <= 14 days)
  - Medium: target <= 30 days
  - Low: target <= 90 days

## Baseline rules
- PII must be minimized and segregated.
- Anti-doxxing controls are mandatory.
- Critical actions must be auditable.
- Dependency and supply-chain checks must run in CI.

## Vulnerability disclosure process
1. Reporter submits private details with reproduction steps.
2. Maintainers triage severity and impacted scope.
3. Fix is prepared in a private patch branch when needed.
4. Public advisory is released after patch availability.

## Supply chain
See `docs/SECURITY/SUPPLY_CHAIN_v1.md`.

## Auth and access control
See `docs/SECURITY/AUTH_ACCESS_CONTROL_v1.md`.
