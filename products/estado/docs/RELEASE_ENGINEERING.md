# Release Engineering v1

## Objectives
- Keep releases reproducible and auditable.
- Use semantic versioning for predictable upgrades.
- Automate changelog generation from Conventional Commits.

## Versioning policy
- `MAJOR`: breaking changes in API/contracts or required migration behavior.
- `MINOR`: backward-compatible features.
- `PATCH`: backward-compatible fixes.

## Automation
- Workflow: `.github/workflows/release.yml`
- Tool: `release-please`
- Config: `.release-please-config.json`
- Manifest: `.release-please-manifest.json`
- Changelog: `CHANGELOG.md`

## Release flow
1. Contributors merge PRs into `main` with Conventional Commit titles.
2. Release workflow updates/opens a release PR with version bump + changelog.
3. Maintainers review and merge release PR.
4. Action creates Git tag and GitHub Release.

## Branch and tag conventions
- Protected branch: `main`
- Release tags: `vX.Y.Z`

## Maintainer checklist (before merge of release PR)
- Confirm CI green.
- Confirm migration impact documented.
- Confirm security-impacting fixes are called out.
- Confirm changelog sections are accurate.

## Rollback
- Create hotfix branch from latest tag.
- Apply minimal fix and merge through PR.
- Release as patch version.
