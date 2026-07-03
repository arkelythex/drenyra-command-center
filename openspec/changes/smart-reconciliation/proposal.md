# Proposal: Smart Reconciliation con ML — Learning Matching Engine

## Problem
Existing reconciliation has 5 strategies (reference, amount-date, amount-entity, fuzzy-entity, partial) but:
- No learning from past matches
- No auto-approval of high-confidence matches
- Each run starts from scratch — no memory of user corrections

## Solution
Add a learning layer on top of existing strategies: store match history, learn patterns, auto-approve high-confidence matches.

## Files
- `packages/application/src/ports/reconciliation-learning.port.ts`
- `packages/infrastructure/src/reconciliation/learning-strategy.ts`
- `packages/infrastructure/src/reconciliation/match-history.store.ts`
- `packages/persistence/src/schema/reconciliation-learning.schema.ts`
