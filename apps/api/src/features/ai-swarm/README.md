# 🤖 AI Agent Swarm - OpenRouter Integration

**Status:** Phase 1 POC (Foundation) | Hardened April 2026
**Version:** 1.0.0
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

Multi-agent AI system for automating SUNAT accounting tasks using OpenRouter gateway.

**Key Features:**
- ✅ Dynamic orchestration (PARL-inspired, no RL training)
- ✅ Hybrid validation (rule-based + AI)
- ✅ Automatic parallelization (batch processing)
- ✅ Cost tracking & budget limits
- ✅ Multiple model support (400+ via OpenRouter)

---

## Architecture

```
┌─────────────────┐
│  Orchestrator   │ ← Analyzes task complexity
│   (Claude 3.5)  │    Decides parallel vs sequential
└────────┬────────┘
         │
    ┌────┴────┬────────┬──────────┐
    │         │        │          │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐ ┌────▼────┐
│  OCR  │ │SUNAT│ │ PCGE  │ │Evidence │
│Agent  │ │Agent│ │Agent  │ │ Agent   │
└───────┘ └─────┘ └───────┘ └─────────┘
```

---

## Quick Start

### 1. Configure Environment

Add to `apps/api/.env` (server-side only):

```bash
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-...

# Optional attribution headers (recommended by OpenRouter)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=ARKELYTHEX
```

If `OPENROUTER_API_KEY` is missing, AI validation is skipped and only the deterministic
SUNAT checks run (RUC/IGV/total/format).

### 2. Test the API

```bash
# Unit tests (runs without OPENROUTER_API_KEY)
cd apps/api
bunx vitest run src/features/ai-swarm/__tests__/unit

# Start API
bun dev
```

---

## Usage Examples

### Validate Single Invoice

```typescript
import { InvoiceValidationWorkflow } from './workflows/invoice-validation.workflow';

const workflow = new InvoiceValidationWorkflow();

const result = await workflow.execute({
  invoices: [
    {
      id: 'INV-001',
      ruc: '20123456789',
      serie: 'F001',
      numero: '00000001',
      fecha: '2026-02-04',
      moneda: 'PEN',
      subtotal: 100,
      igv: 18,
      total: 118,
      items: [
        {
          descripcion: 'Servicio de consultoría',
          cantidad: 1,
          precioUnitario: 100,
          subtotal: 100,
        },
      ],
    },
  ],
  priority: 'high',
});

console.log(result);
// {
//   totalProcessed: 1,
//   totalValid: 1,
//   totalInvalid: 0,
//   results: [...],
//   execution: {
//     parallelized: false,
//     batchSize: 1,
//     totalCostUsd: 0.0006,
//     totalDurationMs: 1234
//   }
// }
```

### Bulk Validation (Parallel)

```bash
curl -X POST http://localhost:3000/api/ai-swarm/validate-invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoices": [...],  // Array of 20+ invoices
    "priority": "medium"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "totalProcessed": 25,
    "totalValid": 23,
    "totalInvalid": 2,
    "execution": {
      "parallelized": true,
      "batchSize": 5,
      "totalCostUsd": 0.015,
      "totalDurationMs": 12000
    }
  }
}
```

---

## API Endpoints

### `POST /api/ai-swarm/validate-invoices`

Validate invoices against SUNAT 2026 regulations.

**Request:**
```json
{
  "invoices": [
    {
      "id": "string",
      "ruc": "string (11 digits)",
      "serie": "string",
      "numero": "string",
      "fecha": "string (ISO date)",
      "moneda": "PEN | USD",
      "subtotal": "number",
      "igv": "number",
      "total": "number",
      "items": [...]
    }
  ],
  "priority": "low | medium | high | critical"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 10,
    "totalValid": 9,
    "totalInvalid": 1,
    "results": [
      {
        "invoiceId": "INV-001",
        "validation": {
          "isValid": true,
          "errors": [],
          "warnings": [],
          "confidence": 0.95
        },
        "metadata": {
          "agentType": "sunat",
          "modelUsed": "google/gemini-2.0-flash-exp:free",
          "tokensUsed": 500,
          "costUsd": 0.00025,
          "durationMs": 1200
        }
      }
    ],
    "execution": {
      "parallelized": true,
      "batchSize": 5,
      "totalCostUsd": 0.006,
      "totalDurationMs": 5000
    }
  }
}
```

---

### `GET /api/ai-swarm/budget`

Get current budget usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": {
      "spent": 2.5,
      "limit": 50,
      "remaining": 47.5,
      "percentage": 5
    },
    "monthly": {
      "spent": 15.3,
      "limit": 500,
      "remaining": 484.7,
      "percentage": 3.06
    },
    "byAgent": {
      "sunat": { "calls": 120, "totalCost": 0.06, "averageCost": 0.0005 }
    },
    "recentUsage": [
      { "agentType": "sunat", "modelUsed": "google/gemini-2.0-flash-exp:free", "tokensUsed": 800, "costUsd": 0.0004, "timestamp": "2026-02-04T00:00:00.000Z" }
    ]
  }
}
```

---

### `POST /api/ai-swarm/analyze-task`

Preview execution strategy without running.

**Request:**
```json
{
  "fileCount": 25,
  "totalSizeBytes": 12500,
  "taskType": "INVOICE",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shouldParallelize": true,
    "batchSize": 5,
    "estimatedCost": 0.3,
    "estimatedTime": 150,
    "agentsRequired": ["ocr", "sunat", "pcge", "evidence"]
  }
}
```

---

### `POST /api/ai-swarm/process-invoices`

Complete end-to-end processing (OCR + SUNAT + PCGE + Evidence).

**Requires:** `OPENROUTER_API_KEY` (OCR + PCGE). If missing, returns HTTP 400 with a hint.

**Request:**
```json
{
  "documents": [
    {
      "id": "DOC-001",
      "imageUrl": "data:image/png;base64,... or https://...",
      "filename": "invoice-001.pdf",
      "mimeType": "application/pdf"
    }
  ],
  "priority": "medium"
}
```

---

## Validation Rules

### Rule-Based (Deterministic)

1. **RUC Validation** - Módulo 11 checksum
2. **IGV Calculation** - 18% of subtotal
3. **Total Calculation** - subtotal + IGV
4. **Serie Format** - FXXX-XXXXXXXX for electronic invoices

### AI-Based (Contextual)

1. **Detracción Logic** - Services > S/ 700
2. **Bancarización** - Transactions > S/ 2,000
3. **Edge Cases** - Complex scenarios
4. **Warnings** - Best practices

---

## Cost Optimization

| Agent Type | Primary Model | Cost/1K Tokens |
|------------|---------------|----------------|
| Orchestrator | Claude 3.5 Sonnet | $0.003 |
| OCR | GPT-4 Vision | $0.01/image |
| SUNAT | Gemini Flash | $0.0005 |
| PCGE | Gemini Thinking | $0.001 |
| Reconciliation | GPT-4 Turbo | $0.005 |

**Projected Cost:** $12 per 1,000 documents (vs $20+ alternatives)

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Processing Time | <5 min for 100 invoices | ⏳ TBD |
| PCGE Accuracy | 95% | ⏳ TBD |
| Cost per 1K docs | <$20 | ✅ $12 (projected) |
| Concurrent RUCs | 10+ | ⏳ TBD |

---

## Testing

```bash
# Run all tests
bunx vitest run src/features/ai-swarm/__tests__/unit

# Run specific test
bun test src/features/ai-swarm/__tests__/unit/sunat-agent.test.ts

# Coverage
bun test --coverage src/features/ai-swarm
```

---

## Troubleshooting

### OpenRouter Rate Limits

If you hit rate limits:

1. Check current usage: `GET /api/ai-swarm/budget`
2. Reduce batch size in orchestrator config
3. Use fallback models (free tier)

### High Costs

1. Enable caching for similar invoices
2. Use cheaper models for simple tasks
3. Set budget alerts

### Low Confidence

If AI validation confidence is <0.7:

1. Flag for human review
2. Use rule-based validation only
3. Improve prompts with examples

---

## Roadmap

### Phase 1 (Current) ✅
- [x] OpenRouter integration
- [x] Orchestrator service
- [x] SUNAT agent
- [x] Invoice validation workflow
- [x] Basic tests

### Phase 2 (Next)
- [ ] OCR agent (PDF extraction)
- [ ] PCGE agent (classification)
- [ ] Evidence agent (storage)
- [ ] Integration tests

### Phase 3 (Future)
- [ ] Reconciliation agent
- [ ] Multi-RUC support
- [ ] Bulk SIRE generation
- [ ] Production deployment

---

## References

- [ADR-009: OpenRouter + LangGraph](../../../../docs/02-adr/adr-009-agent-swarm-openrouter.md)
- [Technical Spec](../../../../docs/03-features/ai-agent-swarm/README.md)
- [Architecture Diagrams](../../../../docs/03-features/ai-agent-swarm/architecture-diagram.md)
- [Implementation Guide](../../../../docs/03-features/ai-agent-swarm/implementation-guide.md)
- [OpenRouter Docs](https://openrouter.ai/docs)

---

**© 2026 ARKELYTHEX - Neural-Symbolic Financial Governance**

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
