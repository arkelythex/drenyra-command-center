# Drenyra Gatekeeper Skill

> **Trigger**: gatekeeper, phase-gate, validation, pipeline-gate, gate
> **Scope**: `project`

## Purpose

Guide AI agents when working with phase gatekeepers in Drenyra's fiscal compliance pipeline. Gatekeepers validate phase outputs before data flows to the next phase.

## Available Gates

### 1. MinimalDataGate

- **Severity**: BLOCKING
- **Checks**: Critical invoice fields are present (RUC, document series, amount, period)
- **Fails when**: Required fields are missing or empty

### 2. XmlValidityGate

- **Severity**: BLOCKING
- **Checks**: XML structure is valid UBL 2.1 and passes schema validation
- **Fails when**: Malformed XML, invalid UBL structure

### 3. ConflictFreeGate

- **Severity**: BLOCKING
- **Checks**: No duplicate document references, no series conflicts, no period mismatches
- **Fails when**: Fiscal conflict detected

### 4. ConfidenceThresholdGate

- **Severity**: WARNING
- **Checks**: AI-generated fiscal decisions meet minimum confidence threshold
- **Fails when**: Confidence below threshold (default 0.85)

## Failure Modes

| Mode            | Behavior                                       |
| --------------- | ---------------------------------------------- |
| `STOP`          | Blocking gate failure stops pipeline execution |
| `WARN_CONTINUE` | Log warning but continue execution             |
| `ESCALATE`      | Flag for human review, pause pipeline          |

## Usage Pattern

```typescript
import { GatedPhasePipeline } from '@drenyra/phase-gatekeeper'

const pipeline = new GatedPhasePipeline({
  onGateBlocked: 'STOP',
  gatesDisabled: false,
})

const result = await pipeline.run(phase, input)
if (result.status === 'BLOCKED') {
  // Investigate gate failures
  console.error(result.preGateResults, result.postGateResults)
}
```

## Testing

All gatekeeper changes require:

- Unit tests for each gate's validation logic
- Integration tests for the full pipeline with gate failures
- Test that `STOP` mode prevents downstream execution
