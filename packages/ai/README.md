---
last-verified: 2026-06-20
source-of-truth: packages/ai/package.json
auto-generated: false
---

# @drenyra/ai — AI Facade

**Última actualización**: 2026-07-09 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 0.1.0 | **Dependencias**: @drenyra/application, @drenyra/infrastructure, @drenyra/persistence, @drenyra/shared

---

## De un vistazo

`@drenyra/ai` es la fachada unificada sobre todas las capacidades de IA en la plataforma Drenyra: registro de modelos, gateway de proveedores, RAG, puente de herramientas, consenso de swarm, recuperación de conocimiento SUNAT y tracking de costos de IA.

Si tu feature necesita hablar con un LLM, extraer datos estructurados de un documento, o validar algo contra la normativa SUNAT — este es el punto de entrada.

---

## 📦 Estructura

```text
packages/ai/src/
├── ai/                       # Módulos core de IA
│   ├── model-registry.ts     # Registro de modelos (disponibles, capacidades)
│   ├── provider.ts           # Abstracción de proveedor
│   ├── router.ts             # Enrutamiento de IA (selección de modelo por tarea)
│   ├── gateway/              # Gateway de proveedores de IA
│   │   └── index.ts
│   ├── tool-bridge.ts        # Puente de tool-calling
│   ├── context/              # Gestión de contexto
│   │   └── index.ts
│   ├── rag/                  # Tipos de RAG
│   ├── openrouter/           # Integración OpenRouter
│   ├── accounting-classifier.service.ts
│   ├── context-cache.service.ts
│   ├── gemini.adapter.ts
│   ├── gemini-tools.ts
│   ├── ocr.service.ts
│   ├── validation.service.ts
│   ├── prompts.ts / models.ts
│   └── schemas/invoice/      # Schemas de extracción de facturas
├── control-plane/            # Plano de control de IA
├── providers/                # Implementaciones de proveedores
├── services/                 # Servicios de IA
│   ├── ai-cost.ts            # Tracking de costos de IA
│   ├── sunat-knowledge.ts    # Recuperación de conocimiento SUNAT
│   ├── swarm-consensus.ts    # Consenso multi-agente
│   ├── swarm-consensus-engine.ts
│   └── swarm-consensus-types.ts
├── agents/                   # Definiciones de agentes
├── cache/                    # Capa de caché de IA
├── model-registry.ts         # Re-export del registro
├── provider.ts               # Provider principal
├── sunat-corpus.ts           # Corpus SUNAT
├── tool-bridge.ts            # Tool bridge principal
└── index.ts                  # API pública
```

### Capacidades Clave

| Módulo | ¿Qué hace? | ¿Cuándo usarlo? |
|--------|------------|-----------------|
| **Model Registry** | Registro central de modelos con metadatos de capacidades | Cuando necesitás saber qué modelo está disponible para una tarea |
| **Gateway** | Gateway unificado (Gemini, OpenRouter, Anthropic, OpenAI) | Cuando querés llamar a un LLM sin acoplar tu código a un proveedor |
| **RAG** | Generación Aumentada por Recuperación para consultas fiscales | Cuando necesitás responder preguntas sobre normativa SUNAT |
| **Tool Bridge** | Puente para tool-calling con extracción estructurada | Cuando querés que un LLM interactúe con tu dominio tipado |
| **Swarm Consensus** | Motor de consenso multi-agente para validación financiera | Cuando múltiples agentes debaten y votan una decisión fiscal |
| **SUNAT Knowledge** | Base de conocimiento de regulación SUNAT para RAG | Cuando la respuesta requiere contexto normativo peruano |
| **AI Cost Tracking** | Tracking de costo por request y gestión de presupuesto | Cuando querés monitorear cuánto estás gastando en IA |

### Subpath Exports

| Ruta de Exportación | Descripción |
|---------------------|-------------|
| `@drenyra/ai` | Exports principales |
| `@drenyra/ai/control-plane` | Plano de control |
| `@drenyra/ai/gateway` | Gateway de proveedores |
| `@drenyra/ai/model-registry` | Registro de modelos |
| `@drenyra/ai/openrouter` | Integración OpenRouter |
| `@drenyra/ai/provider` | Factory de proveedores |
| `@drenyra/ai/sunat-corpus` | Corpus SUNAT |
| `@drenyra/ai/tool-bridge` | Tool bridge |
| `@drenyra/ai/rag/types` | Tipos de RAG |
| `@drenyra/ai/services/*` | Servicios (costos, conocimiento, swarm) |

---

## 🚀 Scripts

```bash
cd packages/ai
bun run test                      # Ejecutar tests (Vitest)
bun run typecheck                 # TypeScript type check
bun run typecheck:experimental    # Type check experimental
```

---

## 🔗 Dependencias

- **Monorepo**: `@drenyra/application`, `@drenyra/infrastructure`, `@drenyra/persistence`, `@drenyra/shared`
- **Externas**: `@google/generative-ai`
- **Dev**: TypeScript ^6.0.3, Vitest ^4.1.7

---

## 🧠 Proveedores de Modelo

La fachada de IA soporta múltiples proveedores a través del gateway:

| Proveedor | Uso Principal |
|-----------|---------------|
| **Google Gemini** | Default para procesamiento de documentos fiscales |
| **OpenRouter** | Enrutamiento multi-proveedor |
| **Anthropic** (vía AI SDK) | Workflows agénticos |
| **OpenAI** (vía AI SDK) | Propósito general |

La selección de proveedor es automática según el tipo de tarea y las capacidades registradas en el model registry.
