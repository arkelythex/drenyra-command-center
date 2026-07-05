# 🔐 Security Feature Primitives

**Status:** ℹ️ Internal security module (not a mounted route surface)  
**Runtime Status:** Not mounted in `apps/api/src/app-core.ts`  
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

This directory contains shared security primitives used across Drenyra runtime surfaces, including:

- caller/session resolution
- RBAC and destructive-action guards
- tenant assertions and RLS context helpers
- encryption helpers for protected payloads
- security-related access logging

It is **not** a standalone public API surface.

## Boundary

This module should be treated as internal infrastructure for mounted features such as auth, AI surfaces, audit flows, and tenant-scoped operations.

Do not count this directory as an active runtime feature unless a dedicated mounted route surface is intentionally introduced.

## Current posture

- keep internal-only
- do not expose a generic `/security` public surface
- treat any future rename as clarity work, not missing functionality

## Related

- `../../app-core.ts`
- `../../../../../docs/meta/unmounted-feature-audit-2026-04.md`

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
