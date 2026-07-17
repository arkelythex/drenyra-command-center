# ADR-0015: Workflow resolution metrics and HTTP transition integration checks

## Status
Accepted

## Context
MVP-B depends on strict workflow invariants. Domain unit tests were present, but end-to-end HTTP transition behavior (including invalid transitions) and resolution latency observability needed explicit coverage.

## Decision
1. Persist report status transitions in database (`report_status_events`) via migration.
2. Compute and expose resolution latency metric:
   - `civictech_report_resolution_seconds` (SUBMITTED -> terminal outcome).
3. Add integration smoke for workflow-B HTTP transitions:
   - Valid path: submit -> triage -> verify -> publish
   - Invalid path checks returning `409` on illegal transitions.

## Consequences
+ Stronger confidence in API-level state-machine behavior.
+ Resolution latency is observable for SLO and operations.
- Additional DB writes per transition and more CI execution time.
