# Engineering Quality Gates

## Mandatory checks on `main`
Required GitHub checks:
- `CI / rust`
- `CI / node`
- `Observability Assets / validate`
- `Integration Auth RBAC / auth-rbac`
- `Integration Observability / observability`
- `PR Title / semantic-title`
- `CodeQL` workflow checks (all language jobs)
- `Secret Scan / gitleaks`
- `Release` workflow must stay enabled on `main`

## Branch protection settings
Configure in GitHub repository settings for branch `main`:
1. Require pull request before merging.
2. Require approvals: at least 1.
3. Require review from CODEOWNERS.
4. Require status checks to pass (checks above).
5. Dismiss stale approvals on new commits.
6. Restrict who can push directly to `main` (prefer nobody).

## Local quality workflow
1. Bootstrap local environment: `pnpm bootstrap`
2. Install git hooks: `bash scripts/setup-githooks.sh`
3. Run quality manually:
   - `pnpm smoke:e2e`
   - `pnpm smoke:workflow-b` (state-machine and 409 transition checks)
   - `pnpm obs:smoke` (when modifying metrics/alerts/dashboards)
   - `pnpm obs:validate` (when modifying Prometheus/Grafana assets)
   - `pnpm quality:check`

## Commit convention
Use Conventional Commits:
- `feat(api): add triage endpoint`
- `fix(infra): repair migration script`
- `docs(governance): add maintainer roles`

Rules:
- Keep subject in imperative mood.
- Keep header concise (<= 72 chars recommended).
- Include scope when possible.
