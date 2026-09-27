# Drenyra Runtime (Brain Service Contract)

**Status:** 🔲 P0 — Contract only | **Last Updated:** 2026-09-01
**Última actualización:** 2026-09-01
**Base Path:** Not mounted in `app-core.ts`

---

## Overview

Drenyra Runtime is the local **Brain Service compatibility contract** for the Command Center web/API surface owned by this repository. Runtime and control-plane authority belongs to `drenyra-ai`; the Pi-native operator harness belongs to `drenyra-pi`. A separate operator CLI may consume the same contracts as an external client, but it is not implemented here.

This feature owns schemas and future routes for:

- Threads (conversation/runtime sessions)
- Turns (user + agent messages within a thread)
- Items (structured data within turns)
- Agent/workflow runs
- Approvals (human-in-the-loop gates)
- Web search audit events

## Current Posture

P0 is **contract-only**. Do not route production traffic here until storage, auth, and audit persistence are implemented.

These schemas are the **local source of truth** for Command Center API/web payload validation and must not be loosened without integration review against the contracts owned by `drenyra-ai` and consumed by `drenyra-pi` or other external operator clients.

## Planned Endpoints

| Method | Path | Purpose |
| -------- | ------ | --------- |
| POST | `/runtime/threads` | Create a new thread |
| GET | `/runtime/threads/:id` | Get thread with turns |
| POST | `/runtime/threads/:id/turns` | Submit a turn |
| GET | `/runtime/threads/:id/turns` | List turns |
| POST | `/runtime/approvals` | Submit approval decision |
| GET | `/runtime/runs` | List agent/workflow runs |

> **Note:** These endpoints are **planned** — not yet mounted or implemented. The schemas exist as contracts.

## References

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
