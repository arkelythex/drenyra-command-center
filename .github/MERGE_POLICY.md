# Merge policy: repo reference vs. GitHub settings

This file documents **conventions and where to configure** branch protection. It does not replace the GitHub UI: an **admin** must apply rules under **Settings** (or [organization rulesets](https://docs.github.com/en/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization) on Team/Enterprise).

| Location | What it does |
|----------|----------------|
| [`.github/branch-protection-main.json`](branch-protection-main.json) | **Versioned reference** for `main` (required checks, reviews, linear history). Copy values into **Settings > Branches** when setting up or auditing. |
| [`.github/pull_request_template.md`](pull_request_template.md) | Default body for new PRs. |
| [`.github/dependabot.yml`](dependabot.yml) | Dependency update PRs; review and run CI like any other change. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contributor flow: branch from `main`, PR, merge method, delete branch. |
| **GitHub: Settings > Branches** (or **Rules > Rulesets**) | **Authoritative** branch protection. [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) can layer with classic rules; the stricter rule wins. |
| **GitHub: Settings > General > Pull Requests** | Default merge button (e.g. **squash**), auto-delete head branches, etc. — align with [linear history](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-linear-history) expectations. |

## Required status checks (CI/CD Pipeline)

The workflow name is `CI/CD Pipeline` (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)). In the branch protection UI, checks appear as:

`CI/CD Pipeline / <Job name>`

The reference [`.github/branch-protection-main.json`](branch-protection-main.json) lists the checks we intend to require (from the job `name:` fields, e.g. `Lint & Type Check`, `Unit Tests`, `All Checks Passed`). If GitHub’s picker shows different labels after a workflow change, use the **exact** strings from a **green** PR’s checks list and update the JSON to match.

**Strict “Require branches to be up to date before merging”** forces every PR to merge `main` after others land; that is safer but increases churn. If self-hosted runners are a bottleneck, consider leaving it off and/or using a [merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue) for high merge volume (GitHub Pro/Team/Enterprise).

## Admin checklist (apply once per repo, or when auditing)

1. **Protect `main`:** require a **pull request** before merge; at least **one** approval; **dismiss stale** reviews on new commits; **require conversation resolution**; **no bypass** for admins (same intent as `enforce_admins: true` in the JSON).
2. **Required checks:** add the `CI/CD Pipeline / …` checks listed in [`.github/branch-protection-main.json`](branch-protection-main.json) (verify names in the UI after a green run).
3. **Block force push and branch deletion** on `main` unless you have a rare exception process.
4. **Linear history** (if you want only squash/rebase on `main`): match [`.github/branch-protection-main.json`](branch-protection-main.json) `required_linear_history`.
5. **Default merge method:** set **Squash and merge** (or allow only **Rebase**) if the team agrees — consistent with a linear `main` history.
6. **After merge:** enable **auto-delete head branches** if desired; periodically delete stale remote branches that are already merged. **Squash and merge:** the feature branch’s tip is often **not** an ancestor of `main` (history was rewritten on merge), so `git merge-base --is-ancestor` can say “no” even when the work is on `main`—use PR status or compare diff, then delete the remote head branch. Do not combine several unrelated feature branches in one undifferentiated merge ([CONTRIBUTING.md](../CONTRIBUTING.md)).
7. **Runners / CI:** if checks stay `pending`, fix runner capacity; do not turn off required checks to unblock merges.

## Emergency / hotfix

For urgent production fixes, use a dedicated `hotfix/…` branch from the release tag, minimal diff, one review, same CI. Document in your incident runbook; avoid bypassing protection except through an audited process (see [GitHub docs: bypassing branch protections](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches) if your org allows a bypass list).

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación clara, cálida y progresiva.*
