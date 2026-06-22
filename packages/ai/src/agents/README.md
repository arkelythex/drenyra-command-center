# AI Agent Swarm — Arkelythex

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../../../docs/meta/gentleman-philosophy.md)

Sistema de agentes de IA para procesamiento inteligente de facturas peruanas según normativa SUNAT 2026.

## De un vistazo

Este directorio contiene las definiciones de los 4 agentes del swarm que trabajan en paralelo para extraer, validar y arbitrar datos de facturas peruanas. Cada agente tiene un rol específico y un modelo de IA asignado según la tarea.

| Agente | Modelo | Rol |
|--------|--------|-----|
| **Reader** | Gemini Flash A | Extracción multimodal de imágenes/PDF |
| **Parser** | Gemini Flash B | Validación de XML UBL 2.0/2.1 |
| **Validator** | Grok Code Fast 1 | Cumplimiento normativo SUNAT 2026 + generación XML |
| **Arbitrator** | Gemini Pro | Resolución de conflictos multi-agente |

## 🎯 Características

- **Multi-Agent Debate**: 4 agentes especializados trabajando en paralelo
- **SUNAT 2026 Compliant**: Validación automática según normativa vigente
- **UBL 2.1**: Generación de XML compatible con SUNAT
- **Context Caching**: Ahorro del 90% en costos de API
- **Event-Driven**: Arquitectura asíncrona y escalable
- **Type-Safe**: TypeScript completo con tipos estrictos

## 🤖 Agentes

### 1. Reader Agent (Gemini Flash A)

- **Función**: Extracción multimodal de facturas
- **Input**: Imágenes, PDFs, fotos de recibos
- **Output**: Datos estructurados con confianza y flags
- **Especialización**: OCR, detección de campos, validación básica

### 2. Parser Agent (Gemini Flash B)

- **Función**: Validación de XML UBL 2.0/2.1
- **Input**: Archivos XML existentes
- **Output**: Datos parseados con discrepancias
- **Especialización**: Validación de esquemas, migración UBL

### 3. Validator Agent (Grok Code Fast 1)

- **Función**: Cumplimiento normativo SUNAT 2026
- **Input**: Datos propuestos de factura
- **Output**: Validación + XML generado
- **Especialización**: Reglas fiscales, generación XML

### 4. Arbitrator Agent (Gemini Pro)

- **Función**: Resolución de conflictos multi-agente
- **Input**: Outputs de los 3 agentes anteriores
- **Output**: Decisión final con trazabilidad
- **Especialización**: Multi-Agent Debate, audit trail

## 📦 Instalación

```bash
# El sistema ya está integrado en el monorepo
cd packages/infrastructure
bun install
```

## 🚀 Uso Básico

```typescript
import { createAgentSwarm } from '@arkelythex/infrastructure/ai-agents';

// 1. Configurar agentes
const orchestrator = createAgentSwarm({
  geminiApiKey: process.env.GOOGLE_AI_API_KEY!,
  grokApiKey: process.env.XAI_API_KEY!,
  cacheEnabled: true,
  parallelExecution: true,
});

// 2. Procesar factura
const result = await orchestrator.processInvoice({
  type: 'invoice_image',
  data: base64EncodedImage,
  metadata: {
    ruc: '20123456789',
    period: '2026-01',
  },
});

// 3. Verificar resultado
if (result.status === 'success') {
  console.log('✅ Factura procesada:', result.invoiceData);
  console.log('📄 XML generado:', result.xmlContent);
} else if (result.status === 'manual_review') {
  console.log('⚠️ Requiere revisión manual');
} else {
  console.error('❌ Error:', result.errors);
}
```

## 🔧 Configuración Avanzada

```typescript
import { AgentSwarmFactory } from '@arkelythex/infrastructure/ai-agents';

const factory = new AgentSwarmFactory({
  geminiApiKey: process.env.GOOGLE_AI_API_KEY!,
  grokApiKey: process.env.XAI_API_KEY!,

  // Selección de modelos
  models: {
    reader: 'gemini-3-flash',      // Gemini 3 Flash para OCR
    parser: 'gemini-2.5-flash',    // Gemini 2.5 para parsing
    validator: 'grok-code-fast-1', // Grok para validación
    arbitrator: 'gemini-pro',      // Gemini Pro para arbitraje
  },

  // Performance
  cacheEnabled: true,
  parallelExecution: true,

  // Logging
  logLevel: 'info',
  enableMetrics: true,
});

const orchestrator = factory.createOrchestrator();

// Suscribirse a eventos
const eventBus = factory.getEventBus();

eventBus.on('EXTRACTION_COMPLETE', (event) => {
  console.log('Reader completado:', event.data);
});

eventBus.on('CONFLICT_DETECTED', (event) => {
  console.log('Conflictos detectados:', event.conflicts);
});

eventBus.on('PROCESS_COMPLETED', (event) => {
  console.log(`Proceso completado en ${event.totalTime}ms`);
});
```

## 📊 Eventos del Sistema

El Event Bus emite los siguientes eventos:

| Evento | Disparado cuando... |
|--------|---------------------|
| `INVOICE_RECEIVED` | Se recibe una factura |
| `EXTRACTION_STARTED` | Reader inicia |
| `EXTRACTION_COMPLETE` | Reader completa |
| `PARSING_STARTED` | Parser inicia |
| `PARSING_COMPLETE` | Parser completa |
| `VALIDATION_STARTED` | Validator inicia |
| `VALIDATION_COMPLETE` | Validator completa |
| `CONFLICT_DETECTED` | Se detectan conflictos entre agentes |
| `ARBITRATION_STARTED` | Arbitraje inicia |
| `ARBITRATION_COMPLETE` | Arbitraje completa |
| `XML_GENERATED` | XML generado |
| `PROCESS_COMPLETED` | Proceso exitoso |
| `PROCESS_FAILED` | Proceso fallido |
| `MANUAL_REVIEW_REQUIRED` | Requiere revisión manual |

## 💰 Costos y Estrategia Híbrida (Enero 2026)

Para **100,000 facturas/mes**, implementamos una estrategia de optimización que combina modelos propietarios de alta precisión con modelos Open Source eficientes.

| Agente | Full Proprietary | Híbrida (Propuesta) | Ahorro |
|--------|-----------------|---------------------|--------|
| **Reader** | Gemini 3 Flash ($150) | Gemini 3 Flash ($150) | 0% (Calidad visual crítica) |
| **Parser** | Gemini 3 Flash ($80) | **Phi-5 (Local/WASM)** ($5 servidor) | **~93%** |
| **Validator** | Grok Code Fast ($90) | **DeepSeek-V3 (Groq)** ($25) | **~72%** |
| **Arbitrator** | Gemini 3 Flash ($40) | Gemini 3 Flash ($40) | 0% (Juez final) |
| **TOTAL** | **$360 / mes** | **$220 / mes** | **~40% Ahorro Total** |

### ROI Estimado (Mercado Perú 2026)

| Concepto | Valor |
|----------|-------|
| Costo Manual | S/ 20,000/mes (equipo de digitadores) |
| Costo Arkelythex | ~$220 USD/mes (S/ 850) |
| **Ahorro neto** | **S/ 19,150/mes** |
| **Eficiencia** | **95% de margen operativo** |

## 🔒 Seguridad

- API Keys en variables de entorno (nunca en código)
- Validación estricta de RUC y datos fiscales
- Audit trail completo de decisiones del árbitro
- Almacenamiento de XML firmado por 5 años (Ley SUNAT)

## 📈 Métricas

```typescript
const stats = factory.getStats();

console.log('Gemini Instances:', stats.geminiInstances);
console.log('Grok Cache:', stats.grokCache);
console.log('Event Bus:', stats.eventBusStats);
```

## 🧪 Testing

```typescript
// Test básico
import { describe, it, expect } from 'vitest';

describe('Agent Swarm', () => {
  it('should process invoice successfully', async () => {
    const orchestrator = createAgentSwarm({
      geminiApiKey: 'test-key',
      grokApiKey: 'test-key',
    });

    const result = await orchestrator.processInvoice({
      type: 'invoice_image',
      data: mockBase64Image,
    });

    expect(result.status).toBe('success');
    expect(result.invoiceData).toBeDefined();
  });
});
```

## 📚 Documentación Adicional

- [Diseño de Arquitectura](/.agents/architecture/agent-swarm-design.md)
- [Reglas de Arquitectura](/.agents/rules/architecture.md)
- [Normativa SUNAT 2026](/.agents/rules/sunat-2026.md)
