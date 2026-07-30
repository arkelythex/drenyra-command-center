# M3 — Headless Mission Protocol + CLI Client

## Worktree
Worktree: /home/dreamcoder08/Documents/PROYECTOS/Drenyra/worktrees/m3-mission-protocol
Canonical repo: /home/dreamcoder08/Documents/PROYECTOS/Drenyra

## Background
M1 built durable mission infrastructure. M2 built real monthly close pipeline. Now M3 must extract the mission protocol into a reusable SDK and prove it works from a completely independent surface (Go CLI) — demonstrating zero React-hidden logic.

## What exists
- apps/api with /api/v1/missions/* routes (6 endpoints)
- packages/mission-domain with all types, transitions, receipts, events
- apps/cli/ — Go CLI (Cobra + Bubble Tea), 9,842 lines
- internal/harness/client.go — HTTP client pattern with auth headers
- No mission-specific CLI commands exist

## M3A Deliverable: @drenyra/mission-client (TypeScript)
Create packages/mission-client/ with:
- src/mission-client.ts — MissionClient interface:
  create(input), get(id), execute(id, command), approve(id, approval),
  reject(id, rejectInput), reconcile(id, reconcileInput),
  subscribe(id, cursor?), verifyReceipt(id)
- src/http-mission-client.ts — HTTP implementation using fetch
  - Sets X-Idempotency-Key header
  - SSE subscription with reconnection
  - Error mapping from API
- src/mission-errors.ts — typed client errors
- src/index.ts — barrel

Follow the existing package patterns (packages/memory/ for structure).
Reference existing types from packages/mission-domain/src/mission-contracts.ts

## M3B Deliverable: CLI Mission Commands (Go)
Add to apps/cli/internal/cmd/:
- close.go — "drenyra close" parent command
- close_create.go — "drenyra close create --company --period"
- close_status.go — "drenyra close status <id> [--json]"
- close_gates.go — "drenyra close gates <id> [--json]"
- close_exceptions.go — "drenyra close exceptions <id> [--json]"
- close_approve.go — "drenyra close approve <id> --proposal-version [--json]"
- receipt.go — "drenyra receipt verify <id> [--json]"

Add to apps/cli/internal/harness/:
- missions.go — MissionClient HTTP implementation following existing patterns
  - GetMission(id), ExecuteMission(id, version), ApproveMission(id, version, evidenceHash)
  - RejectMission(id, version, reason), GetGates(id), GetExceptions(id), VerifyReceipt(id)

Also add mission types to apps/cli/internal/harness/types.go following existing type patterns.

## Patterns to follow
- Existing CLI commands in internal/cmd/ (Cobra RunE pattern)
- Existing harness client in internal/harness/client.go (HTTP with auth headers)
- Existing Go types in internal/harness/types.go
- Package structure from packages/memory/ for TypeScript package

## Delivery
- All 7 CLI commands working with --json flag
- MissionClient interface with HTTP implementation
- Tests for both SDK and CLI