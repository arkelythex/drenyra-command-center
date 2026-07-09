# Release Process

**Last updated**: 2026-07-09

---

*Alineado con la [Filosofía Gentleman](docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación que prioriza la claridad y el respeto por tu tiempo.*

## Versioning

ARKELYTHEX follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`) based on
[Conventional Commits](https://www.conventionalcommits.org/):

| Bump | Trigger |
|------|---------|
| **MAJOR** | Breaking change in public API, database schema, or fiscal behavior |
| **MINOR** | New feature, backward-compatible |
| **PATCH** | Bug fix, documentation, refactor, tooling |

Pre-release: `v{major}.{minor}.{patch}-rc.{n}` (e.g., `v2.6.0-rc.1`)

## Current Version

Current version is defined in `package.json` at repo root. Check it with:

```bash
node -p "require('./package.json').version"
```

## Creating a Release

1. **Verify CI is green** on `main` — all checks must pass (lint, typecheck, tests, docs:verify)
2. **Generate changelog** from commits since the last tag:

```bash
git log --oneline --no-decorate $(git describe --tags --abbrev=0)..HEAD
```

3. **Determine next version** based on commits (see Versioning table above)
4. **Create and push tag**:

```bash
git tag -a v{major}.{minor}.{patch} -m "v{major}.{minor}.{patch}"
git push origin v{major}.{minor}.{patch}
```

5. **Verify** the CI release pipeline triggers and passes

### Release Candidate Workflow

For pre-release testing:

```bash
git tag -a v{major}.{minor}.{patch}-rc.{n} -m "v{major}.{minor}.{patch}-rc.{n}"
git push origin v{major}.{minor}.{patch}-rc.{n}
```

## Changelog

The canonical changelog is generated from git history at release time.
There is no separate `CHANGELOG.md` — the commit log IS the changelog.

Key conventions for readable changelogs:
- Each commit uses Conventional Commits format
- Breaking changes are marked with `!` after the type/scope (e.g., `feat(api)!: remove deprecated endpoint`)
- Filter relevant commits: `git log --oneline --no-decorate --grep="^feat\|^fix\|^refactor"`

## Release Approval

Only the project maintainer (`@dreamcoder08`) can cut a release.
Approval chain: feature complete → CI green → maintainer tags → release deploys.

## Release Cadence

ARKELYTHEX does not follow a fixed release schedule. Releases happen when:
- Features are complete and verified
- Breaking changes are accumulated
- A critical fix needs to ship
