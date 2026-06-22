# Drenyra Runtime (Brain Service Contract)

**Status:** 🔲 P0 — Contract only | **Last Updated:** 2026-06-20
**Última actualización:** 2026-06-20
**Base Path:** Not mounted in `app-core.ts`

---

## Overview

Drenyra Runtime is the **Brain Service contract** for Drenyra CLI and the React Command Center. CLI and UI do not execute separate intelligence — they submit turns to the same thread.

This feature owns schemas and future routes for:
- Threads (conversation/runtime sessions)
- Turns (user + agent messages within a thread)
- Items (structured data within turns)
- Agent/workflow runs
- Approvals (human-in-the-loop gates)
- Web search audit events

## Current Posture

P0 is **contract-only**. Do not route production traffic here until storage, auth, and audit persistence are implemented.

These schemas are the **source of truth** for CLI/API/UI payload validation and must not be loosened without integration review.

## Planned Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/runtime/threads` | Create a new thread |
| GET | `/runtime/threads/:id` | Get thread with turns |
| POST | `/runtime/threads/:id/turns` | Submit a turn |
| GET | `/runtime/threads/:id/turns` | List turns |
| POST | `/runtime/approvals` | Submit approval decision |
| GET | `/runtime/runs` | List agent/workflow runs |

> **Note:** These endpoints are **planned** — not yet mounted or implemented. The schemas exist as contracts.

## References

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
