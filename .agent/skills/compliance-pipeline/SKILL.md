---
name: drenyra-compliance-pipeline
description: "Trigger: pipeline, compliance, fiscal-pipeline, orchestrator, compliance-pipeline. Guide AI agents working with the Drenyra compliance pipeline — the FiscalSDD system that runs fiscal complianc..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Compliance Pipeline Skill

> **Trigger**: pipeline, compliance, fiscal-pipeline, orchestrator, compliance-pipeline
> **Scope**: `project`

## Purpose

Guide AI agents working with the Drenyra compliance pipeline — the FiscalSDD system that runs fiscal compliance checks through a gated phase pipeline.

## Pipeline Architecture

```
solicitud → [gates] → análisis → [gates] → diseño → [gates] → plan → [gates] → migración → [gates] → auditoría
```

Each phase has optional pre-execution and post-execution gates.

## Key Components

### FiscalSDDPipeline

The pipeline definition with sequential phases and gate configuration.

```typescript
const pipeline: FiscalSDDPipeline = {
  id: 'igv-compliance-check',
  name: 'IGV Rate Compliance',
  phases: [
    { name: 'solicitud', execute: proposeChange, gate: solicitudGate },
    { name: 'análisis', execute: analyzeChange, gate: analysisGate },
    { name: 'diseño', execute: designChange, gate: designGate },
    { name: 'plan', execute: planChange, gate: planGate },
    { name: 'migración', execute: migrateChange, gate: migrationGate },
    { name: 'auditoría', execute: auditChange },
  ],
  onGateBlocked: 'STOP',
}
```

### PhaseGatekeeper

Validates phase outputs before data flows downstream.

### Evidence Store

Persists every phase input, output, and gate verdict for audit trail.

## CLI Usage

```bash
# Run the full compliance pipeline
drenyra pipeline run <change-id>
  --ruc 20123456789
  --periodo 2026-07
  --titulo "IGV Rate Update"
  --modo auto

# Check pipeline status
drenyra pipeline status <change-id>
```

## Testing

Compliance pipeline changes require:

- Unit tests for each phase's logic
- Gate failure integration tests
- A `compliance:sire-repro` for any SUNAT/SIRE behavior change
