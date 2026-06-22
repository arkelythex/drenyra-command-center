# 🛰️ Agent Audit Trail

**Status:** ℹ️ Internal support surface  
**Runtime Status:** Not mounted in `apps/api/src/app-core.ts`  
**Canonical Adjacent Surfaces:** `governance-audit`, `ai-workers`, `ai-swarm`  
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

This module packages audit-chain, exporter, and plugin-evaluation capabilities for agent-related workflows.

It is **not** part of the canonical mounted runtime baseline today, so it should be treated as internal support code rather than a shipped public feature surface.

## Current posture

- keep internal
- do not count as active runtime product capability
- promote only if a mounted governance/AI owner adopts a clear public contract

## Why it stays internal

- runtime authority already lives in mounted audit and AI surfaces
- the current exports are broad and implementation-oriented rather than a clearly owned public API
- local tests and exporters show useful capability, but not a canonical mounted surface

## Related

- `../../app-core.ts`
- `../../../../../docs/10-project-management/internal-support-boundary-plan-2026-04.md`

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
