# Intended usage

**Última actualización**: 2026-10-02

## What this repository is

The **Accounting Command Center**: the product surface (API, web, fiscal domain) of Drenyra, a verifiable financial operating system for Peru (SUNAT/SIRE first). Agents propose, deterministic validators check, professionals approve material decisions, and every action produces an evidence receipt.

## What it is for

- Running the fiscal API and web command center per organization, company and RUC.
- Hosting the framework-free fiscal domain (`packages/domain`) and its use cases (`packages/application`).
- Consuming the published `drenyra-ai` contracts for missions, receipts and review, and operating through `drenyra-shell` and `drenyra-engram` (see [`drenyra-ai-integration.md`](10-development/drenyra-ai-integration.md)).

## What it is not for

- Not a general-purpose ERP, and not a home for non-accounting products (extracted to their own repos).
- Not a place to store real customer or fiscal data in fixtures, examples or memory.
- Not an autonomous filer: material fiscal actions need human approval and leave a receipt.

## Who should read what

| You are… | Start with |
|----------|------------|
| A contributor | [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`odd-workflow.md`](10-development/odd-workflow.md) |
| An AI agent | [`AGENTS.md`](../AGENTS.md), [`AI_POLICY.md`](../AI_POLICY.md), [`CODEX-MAP.md`](../CODEX-MAP.md) |
| An integrator | [`drenyra-ai-integration.md`](10-development/drenyra-ai-integration.md), [`canonical-stack.md`](01-foundation/canonical-stack.md) |
| A reviewer | [`docs/12-security/`](12-security/README.md), [`docs/11-adr/`](11-adr/README.md) |
