# 📊 Reports

**Status:** 🟡 Mounted baseline / hardening in progress
**Base Path:** `/reports`
**Runtime Status:** Mounted through `apps/api/src/api-module-surface.ts`
**Canonical Adjacent Surfaces:** `analytics`, `dashboard`, `cashflow`
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

This module contains reporting endpoints such as:

- profit and loss
- balance sheet
- cash flow
- sales by customer

The surface is part of the active API module surface. Treat it as a baseline reporting slice, not a final accounting authority.

## Current posture

- treat as mounted baseline with explicit hardening guardrails
- reconcile future ownership with `analytics` and `dashboard`
- first hardening slice landed: Zod query schemas now guard date ranges and as-of dates before service execution
- second hardening slice landed: route handlers now validate report response contracts before returning payloads
- third hardening slice landed: profit-and-loss now computes a baseline from paid invoices and paid bills instead of revenue-only placeholders
- fourth hardening slice landed: balance-sheet and cash-flow now expose baseline semantics (open receivables/payables and operating paid-movement net) instead of pure zero placeholders
- fifth hardening slice landed: report company scope now comes from `X-Company-Id`, not caller-controlled query parameters
- current currency posture is explicit PEN-only aggregation until exchange-rate normalization is promoted

## Related

- `../../app-core.ts`
- `../../../../../docs/meta/unmounted-feature-audit-2026-04.md`

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
