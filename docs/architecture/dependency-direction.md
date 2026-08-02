# Dependency Direction — Drenyra (Accounting Command Center)

> **Last updated:** 2026-08-01.

> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version/sequence numbers are JSON integers, never floats.

## Ecosystem dependency graph

```text
                        ┌───────────────────┐
                        │ Drenyra-Engram    │
                        │ Accounting Memory │
                        └─────────▲─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────┴────────┐        ┌─────────┴─────────┐
           │ Drenyra-AI      │        │ Drenyra-Pi       │
           │ Agent Ecosystem │◄───────│ Pi-native Harness│
           └────────▲────────┘        └───────────────────┘
                    │
           ┌────────┴────────┐
           │ Drenyra         │
           │ Command Center  │
           └─────────────────┘
```

Arrows point toward the dependency. `Drenyra-AI` is consumed by both Drenyra and Drenyra-Pi; `Drenyra-Engram` is read by the others and depends on nothing.

## Direction rules applied to Drenyra

### Drenyra MAY depend on

| Repo             | How                                                  | Constraint |
| ---------------- | ---------------------------------------------------- | ---------- |
| `drenyra-ai`     | released, versioned npm artifacts                    | never a checkout; no vendoring |
| `drenyra-engram` | memory reads/context through its surfaces            | memory never authorizes; approvals stay in `drenyra-ai` gates + humans |

### Drenyra must NEVER be depended on

- **`drenyra-ai` must never depend on Drenyra.** It is standalone by design; its contracts never import Drenyra types, UI, or SUNAT flows.
- **`drenyra-pi` must never depend on Drenyra.** The harness layers over `drenyra-ai` only.
- **`drenyra-engram` must never depend on Drenyra.** It is independent.
- Extracted code moves **out of** Drenyra into `drenyra-ai` and is consumed back as a released artifact — one direction only.

## Rules in practice

1. Drenyra imports contract types from `drenyra-ai` / `drenyra-engram`; it does not define canonical copies.
2. A change that would require editing `drenyra-ai` to satisfy Drenyra internals is a contract bug: the contract is public, Drenyra adapts.
3. Drenyra never publishes types INTO `drenyra-ai`; the direction is one-way.
4. Drenyra pins released versions; upgrades are explicit, tested, and receipted.

## Why this matters

The ecosystem depends on `drenyra-ai` and `drenyra-engram` staying independent. If Drenyra leaks into them, ERPs, other SaaS, and agent hosts lose the standalone runtime — and the ecosystem collapses back into one monolith.
