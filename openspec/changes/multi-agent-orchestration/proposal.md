# Proposal: Multi-Agent Orchestration — Model Routing + Delegation

## Problem
Today all agents use one model. Codex proves that specialized agents with different models outperform monoliths.

## Solution
Multi-AI model router: each fiscal phase gets the right model.
- PCGE classification → Sonnet (balanced)
- Anomaly detection → Opus (high reasoning)
- Document ingestion → Flash (fast, cheap)
- Tax calculation → Deterministic (no AI needed)
- SUNAT validation → Deterministic (no AI needed)

## Key Concept
```typescript
interface AgentRoute {
  task: string;
  model: "haiku" | "sonnet" | "opus" | "deterministic";
  delegation: "disabled" | "explicit" | "proactive";
  maxTokens: number;
}
```

## Implementation
- Extend existing ai/model-registry with routing rules
- Add delegation config per phase (Codex-inspired: disabled/explicit/proactive)
- Wire into Fiscal Agent 24/7 steps
