<!-- Manual navigation map for Drenyra CLI (Go). See CODEX-MAP.md for monorepo root. -->

# DRENYRA-CLI-MAP — Drenyra CLI Navigation

**Última actualización**: 2026-07-08

## Start here

- **Location:** `apps/cli/`
- **Product philosophy:** Gentleman Fiscal Terminal. See
  [`docs/products/drenyra-product-philosophy.md`](../../docs/products/drenyra-product-philosophy.md).
- **Language:** Go CLI with terminal-native workflows.
- **Primary plans:**
  - [CLI Gentleman Fiscal Terminal](../../openspec/changes/drenyra-cli-gentleman-fiscal-terminal/proposal.md)
  - [P1 Fiscal Terminal](../../openspec/changes/drenyra-p1-fiscal-terminal/proposal.md)
  - [S5 Go CLI Alignment](../../openspec/changes/drenyra-s5-go-cli-alignment/proposal.md)

## Product model

The CLI should become Drenyra's terminal-native fiscal operator: fast,
scriptable, safe, reviewable, and aligned with the web command center.

Baseline rules:

- Commands must be useful without TUI polish.
- Fiscal operations must preserve organization, company, RUC, and period scope.
- Agentic actions must prepare and explain work; risky mutations require human
  approval and audit output.
- Local memory/history must not store secrets or raw customer-sensitive data.

## Review path

1. Start with command semantics and fiscal scope.
2. Review execution engine behavior and deterministic errors.
3. Review TUI context, evidence, and approval surfaces.
4. Run Go tests when implementation code changes.
