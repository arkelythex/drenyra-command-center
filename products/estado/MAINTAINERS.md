# Maintainers

This file defines who maintains each area and expected response times.

## Roles
- Project Lead: technical direction, final decision authority.
- Maintainer: reviews and merges within owned scope.
- Reviewer: provides technical feedback and risk checks.

## Ownership map
| Scope | Owner | Backup | Review SLA |
|---|---|---|---|
| `crates/*` | `@dreamcoder08` | `TBD` | 3 business days |
| `apps/*` | `@dreamcoder08` | `TBD` | 3 business days |
| `infra/*` | `@dreamcoder08` | `TBD` | 2 business days |
| `docs/*` | `@dreamcoder08` | `TBD` | 5 business days |
| security reports | `@dreamcoder08` | `TBD` | acknowledge in 48h |

## Maintainer responsibilities
- Keep quality gates green before merge.
- Reject PRs without tests/doc updates when required.
- Escalate security and privacy issues immediately.
- Keep ADR/RFC records current for major changes.

## Update policy
- Any maintainer change must be proposed in PR and approved by Project Lead.
