# Proposal: PLE-00 — Programa de Libros Electrónicos

## Intent

Implement the Programa de Libros Electrónicos (PLE) subsystem — SUNAT-mandated digital bookkeeping for Peruvian taxpayers. PLE covers Libro Diario, Libro Mayor, Registro de Compras, and Registro de Ventas in SUNAT's required TXT format with hash CDR.

## Current State

- Schema exists: `packages/persistence/src/schema/ple.schema.ts` (pleGenerations table with book type, period, RUC, status lifecycle, CDR hash)
- Zero API routes, zero services, zero UI

## Scope

- PLE generation from ledger data (4 book types)
- TXT format with SUNAT column specifications
- Validation (format, totals, fiscal consistency)
- CDR hash generation
- SUNAT filing (OSE integration)
- Download/view generated files

## Delivery

- Single PR (~800 lines: API routes + services + generation logic + tests)
