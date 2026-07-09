# Spec: A1 — Natural Language Query Engine

> **Phase**: spec
> **Campaña**: A1 Query Engine
> **Depende de**: proposal (aprobado)
> **Dependientes**: A2 Approval Workflow, A3 Web Panel

---

## 1. Comportamiento Esperado

### 1.1 Happy Path

```
drenyra consulta "IGV de julio 2026 para RUC 20123456789"
```

Respuesta:

```text
━━━ Consulta Fiscal ━━━

📋 IGV estimado para julio 2026
  RUC: 20123456789
  Periodo: 2026-07
  IGV estimado: S/ 18,234.50
  Confianza: 0.92
  Basado en: 45 facturas de compra, 12 facturas de venta

📎 Evidencia
  • factura F001-123: IGV S/ 450.00 — CDR ok
  • factura F001-124: IGV S/ 1,200.00 — CDR ok
  • ... (top 5)

🔍 Detalle completo: drenyra consulta "..." --json
```

### 1.2 With JSON output

```
drenyra consulta "IGV de julio 2026" --json
```

```json
{
  "tipo": "igv-consulta",
  "ruc": "20123456789",
  "periodo": "2026-07",
  "resultado": {
    "monto": 18234.5,
    "moneda": "PEN",
    "confianza": 0.92,
    "fuentes": [
      {
        "tipo": "factura-compra",
        "serie": "F001",
        "numero": 123,
        "igv": 450.0,
        "cdr_hash": "abc..."
      },
      {
        "tipo": "factura-compra",
        "serie": "F001",
        "numero": 124,
        "igv": 1200.0,
        "cdr_hash": "def..."
      }
    ],
    "total_facturas_compra": 45,
    "total_facturas_venta": 12
  },
  "evidence_artifacts": [
    {
      "id": "evt-001",
      "kind": "PHASE_OUTPUT",
      "phase": "analysis",
      "hash": "0x..."
    },
    {
      "id": "evt-002",
      "kind": "GATE_RESULT",
      "phase": "gate-igv",
      "hash": "0x..."
    }
  ]
}
```

### 1.3 Error — ambiguous query

```
drenyra consulta "dame el IGV"
```

Respuesta:

```text
⚠ Consulta ambigua. ¿A qué período y RUC te referís?

Ejemplos:
  drenyra consulta "IGV de julio 2026 para RUC 20123456789"
  drenyra consulta "IGV del último mes"
  drenyra consulta "IGV" --ruc 20123456789 --periodo 2026-07
```

### 1.4 Error — insufficient evidence

```
drenyra consulta "IGV de enero 2026"
```

Respuesta:

```text
⚠ No hay suficiente evidencia para enero 2026 (RUC 20123456789)
  Período consultado: 2026-01
  Facturas encontradas: 0 de compra, 0 de venta
  Causa posible: el período aún no fue procesado

  Sugerencia: ejecutá el pipeline de compliance para ese período:
    drenyra pipeline run --ruc 20123456789 --periodo 2026-01
```

## 2. Contrato Técnico

### 2.1 Paquete nuevo: `packages/fiscal-query-engine/`

```
packages/fiscal-query-engine/
├── src/
│   ├── index.ts             # Public API
│   ├── types.ts             # QueryInput, QueryResult, IntentClassification
│   ├── classifier.ts        # NLP intent classifier
│   ├── intent-registry.ts   # Known intent patterns
│   ├── pipeline-router.ts   # Maps intent → pipeline (fiscal SDD)
│   ├── evidence-formatter.ts# Evidence → human-readable markdown
│   └── response-builder.ts  # Builds QueryResult from pipeline output
├── __tests__/
│   ├── classifier.test.ts
│   ├── pipeline-router.test.ts
│   └── evidence-formatter.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 2.2 Tipos principales

```typescript
// Query intent classification
type IntentKind =
  | 'igv-consulta' // "IGV de julio"
  | 'detracciones-consulta' // "detracciones pendientes"
  | 'sire-resumen' // "resumen SIRE"
  | 'retenciones-consulta' // "retenciones del período"
  | 'pipeline-run' // "analizame este período"
  | 'factura-lookup' // "dame la factura F001-123"
  | 'unknown' // no match

interface QueryInput {
  texto: string
  ruc?: string
  periodo?: string
  modo?: 'auto' | 'interactive' | 'supervised'
  output?: 'text' | 'json'
}

interface QueryResult {
  tipo: IntentKind
  ruc: string
  periodo: string
  resultado: Record<string, unknown>
  confianza: number
  fuentes: EvidenceSource[]
  evidence_artifacts: EvidenceRef[]
  error?: string
  sugerencia?: string
}

interface IntentClassification {
  kind: IntentKind
  confidence: number
  extracted: {
    ruc?: string
    periodo?: string
    keywords: string[]
  }
}
```

### 2.3 Classifier: Pattern Matching + AI fallback

```
1. Extract RUC and period from query text (regex)
2. Match intent against keyword patterns (intent-registry.ts):
     ["igv", "iva", "impuesto general"] → 'igv-consulta'
     ["detraccion", "spot", "sistema de pago"] → 'detracciones-consulta'
     ["sire", "libro", "registro de ventas"] → 'sire-resumen'
3. If confidence < 0.7: ask for clarification
4. If confidence < 0.4: fallback to AI classifier (DeepSeek/Claude)
5. If AI also fails: return 'unknown' with suggestions
```

El AI fallback usa el `ModelRouter` del `fiscal-sdd` orchestrator. No creamos un nuevo LLM caller.

### 2.4 Pipeline Router

```
Intent → Pipeline mapping:

'igv-consulta'            → fiscal pipeline: análisis → respuesta
'detracciones-consulta'   → fiscal pipeline: análisis + detracción gate
'sire-resumen'            → fiscal pipeline: análisis + SIRE gate
'pipeline-run'            → full SDD: solicitud → análisis → diseño → plan → migración → auditoría
'factura-lookup'          → direct DB query (no pipeline needed)
```

### 2.5 CLI command: `drenyra consulta`

```
drenyra consulta <texto> [flags]
  --ruc       RUC (opcional, se extrae del texto o contexto)
  --periodo   Período (opcional, default: último mes procesado)
  --json      Output en JSON
  --mode      auto | interactive | supervised (default: auto)
```

### 2.6 API endpoint: `POST /api/consulta`

```json
POST /api/consulta
{
  "texto": "IGV de julio 2026",
  "ruc": "20123456789",
  "periodo": "2026-07",
  "output": "json"
}

Response:
{
  "ok": true,
  "data": { /* QueryResult */ },
  "evidence_artifacts": [...]
}
```

## 3. Criterios de Aceptación

| Criterio | Verificación                                                                      |
| -------- | --------------------------------------------------------------------------------- |
| CA1      | `drenyra consulta "IGV de julio 2026"` devuelve monto estimado con evidencia      |
| CA2      | `drenyra consulta "..." --json` devuelve JSON estructurado con evidence artifacts |
| CA3      | Consulta ambigua devuelve sugerencias en vez de error                             |
| CA4      | Consulta sin suficiente evidencia devuelve diagnóstico + sugerencia de pipeline   |
| CA5      | AI fallback clasifica queries que pattern matching no entiende                    |
| CA6      | POST /api/consulta funciona con misma lógica que CLI                              |
| CA7      | Todas las respuestas incluyen evidence artifacts hash                             |
| CA8      | 95% de queries de prueba se clasifican correctamente                              |

## 4. Pruebas

```bash
# Unit tests
cd packages/fiscal-query-engine && npx vitest run

# Integration (CLI)
drenyra consulta "IGV de julio 2026" --ruc 20123456789 --periodo 2026-07

# Integration (API)
curl -X POST /api/consulta -d '{"texto":"IGV de julio 2026","ruc":"20123456789","periodo":"2026-07"}'

# Query classification accuracy test
bun run test:consulta-classification
```

## 5. No-Alcance (para A1)

- Approval workflow (es A2)
- Web UI (es A3)
- Dashboards con gráficos
- Múltiples RUCs en una consulta
- Export a PDF
