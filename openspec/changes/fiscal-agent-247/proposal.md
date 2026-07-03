# Proposal: Fiscal Agent 24/7 — Autonomous Recurring Fiscal Worker

**Change**: fiscal-agent-247  
**Status**: proposal  
**Date**: 2026-07-03  

## Problem

Drenyra has on-demand AI agents (OCR, PCGE, SUNAT swarm) but NO recurring autonomous workflow. Every night, an accountant or power user must manually:

1. Pull SIRE data from SUNAT
2. Reconcile transacciones del día
3. Categorizar con PCGE
4. Calcular IGV/detracciones
5. Detectar discrepancias
6. Proponer asientos contables

This is the #1 gap against Digits (Agentic Close runs 24/7) and Wesley (80%+ auto-categorization).

## Solution

A recurring agent that runs every night, processes the day's data through a deterministic multi-step pipeline, and surfaces exceptions for human review — learning from corrections over time.

## Business Case

- **Reduce manual fiscal close from 2-3 days to <2 hours**
- **Detect SUNAT discrepancies within 24h instead of at month-end**
- **Learn from user corrections** — each review improves future suggestions
- **Exception-based workflow** — accountants review only what needs attention

## Key Principles (Gentle AI)

1. **Deterministic first, AI second** — TaxRegime, TaxCalculator, SIRE sync are already deterministic rules. AI is used only where judgment is needed (categorization, anomaly detection).
2. **Exception-based review** — The agent proposes; humans review exceptions only.
3. **Audit trail always** — Every suggestion, approval, rejection, and correction goes to FAL/Evidence.
4. **Learn from corrections** — User corrections train the categorization model.
5. **Backward compatible** — Existing on-demand agents continue to work.

## Scope

### In scope
- Recurring scheduler (nightly via cron/BullMQ repeatable jobs)
- Multi-step pipeline: collect → categorize → calculate → reconcile → report
- Integration with existing: SIRE service, TaxCalculator, PCGE agents, Evidence/FAL
- Exception queue with review UI data
- Learning mechanism (corrections → improve categorization)

### Out of scope
- Smart reconciliation with ML (separate phase)
- Multi-AI model routing (separate phase)
- Fiscal Health Dashboard (separate phase)

## Business Rules

1. Worker runs at 2:00 AM daily (configurable per organization)
2. Processes transactions from previous business day
3. Only processes organizations with SUNAT credentials configured
4. Each step is independently retryable (3 attempts)
5. Critical failures (SUNAT API down) alert the organization admin
6. User corrections are saved and used to improve future runs
7. All decisions are auditable via FAL
