---
last-verified: 2026-06-20
source-of-truth: packages/infrastructure/package.json
auto-generated: false
---

# @drenyra/infrastructure — Infrastructure Layer

**Última actualización**: 2026-07-09 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 0.1.0 | **Dependencias**: Drizzle, BullMQ, NATS, AWS S3, AI SDKs

---

## De un vistazo

El paquete **infrastructure** provee las implementaciones concretas de los puertos declarados en la capa de aplicación. Contiene todas las integraciones externas: acceso a base de datos, proveedores de IA, colas de mensajes, buses de eventos, almacenamiento de archivos, procesamiento XML y clientes de APIs de terceros.

Si necesitás conectar Drenyra con algo externo — una base de datos, un LLM, SUNAT, un bucket S3 — la implementación está acá.

---

## 📦 Estructura

```text
packages/infrastructure/src/
├── db/                  # Setup de base de datos y seed scripts
├── ai/                  # Adaptadores y servicios de proveedores de IA
│   ├── gemini.adapter.ts       # Adaptador Google Gemini
│   ├── openrouter/             # Integración OpenRouter
│   ├── model-registry.ts       # Registro de modelos de IA
│   ├── context-cache.service.ts
│   ├── ocr.service.ts
│   ├── accounting-classifier.service.ts
│   ├── validation.service.ts
│   ├── tool-bridge.ts
│   ├── router.ts               # Lógica de enrutamiento de IA
│   ├── prompts.ts, models.ts
│   └── rag/                    # Tipos de RAG
├── events/              # Implementaciones de bus de eventos
│   ├── nats.adapter.ts         # Adaptador NATS
│   ├── in-memory-event-bus.ts  # Fallback in-memory
│   └── event.port.ts
├── queues/              # Colas de trabajo (BullMQ + Redis)
│   ├── document-processor.queue.ts
│   ├── document-processor.worker.ts
│   ├── queues.ts
│   └── redis.ts
├── storage/             # Adaptadores de almacenamiento
│   ├── r2-storage.service.ts   # Cloudflare R2 / S3-compatible
│   ├── local-storage.service.ts
│   └── storage.factory.ts
├── xml/                 # Procesamiento XML
│   ├── ubl-parser.ts           # Parser UBL 2.1 XML
│   ├── ubl-extractor.ts
│   └── ubl-parser.types.ts
├── security/            # Seguridad de infraestructura
│   └── security-service.ts
├── api/                 # Clientes de APIs externas
│   └── sunat.service.ts        # Integración SUNAT API
├── auth/                # Integración de autenticación (Better Auth)
├── cache/               # Capa de caché
├── adapters/            # Implementaciones de adaptadores genéricos
│   └── document-processing.adapter.ts
├── ledger/              # Infraestructura de libro contable
├── services/            # Servicios de infraestructura
│   ├── ai-cost/                # Tracking de costos de IA
│   ├── sunat-knowledge/        # Servicio de conocimiento SUNAT
│   └── swarm-consensus/        # Motor de consenso multi-agente
├── repositories/        # Implementaciones de repositorios
│   └── chat.repository.ts
├── sunat/               # Integración específica SUNAT
├── fiscal-truth/        # Infraestructura de verdad fiscal
├── agents/              # Infraestructura de agentes
├── microkernel/         # Soporte de arquitectura microkernel
├── privacy/             # Infraestructura de privacidad
├── shared/              # Utilidades compartidas de infra
├── validation/          # Validación de infraestructura
├── scripts/             # Scripts utilitarios
└── index.ts             # API pública
```

### Módulos Clave

| Módulo | ¿Qué hace? | Tecnología |
|--------|------------|------------|
| **db/** | Configuración, migraciones y seeds | Drizzle + PostgreSQL |
| **ai/** | Adaptadores de proveedores de IA | Gemini, OpenRouter, Anthropic, OpenAI |
| **events/** | Bus de eventos para comunicación async | NATS / In-Memory |
| **queues/** | Colas de trabajo para procesamiento background | BullMQ + Redis |
| **storage/** | Almacenamiento de archivos | Cloudflare R2 / Local |
| **xml/** | Procesamiento de XML UBL 2.1 | fast-xml-parser |
| **api/** | Clientes de APIs externas | SUNAT, Prometeo |

### Database Configuration

```bash
bun run db:push         # Push schema a la base de datos
bun run db:check        # Verificar integridad del schema
bun run db:studio       # Drizzle Studio UI
bun run db:generate     # Generar migraciones
bun run db:migrate      # Ejecutar migraciones pendientes
bun run db:seed         # Sembrar datos de desarrollo
```

---

## 🚀 Scripts

```bash
cd packages/infrastructure
bun run typecheck       # TypeScript type check
bun run test            # Ejecutar tests (bun test)
bun run db:push         # Push schema
bun run db:check        # Check schema
bun run db:studio       # Drizzle Studio
bun run db:generate     # Generar migración
bun run db:migrate      # Ejecutar migración
bun run db:seed         # Sembrar datos
```

---

## 🔗 Dependencias

- **Domain/App**: `@drenyra/domain`, `@drenyra/application`, `@drenyra/persistence`, `@drenyra/shared`
- **Database**: `drizzle-orm`, `postgres`
- **AI**: `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`, `@google/genai`, `@google/generative-ai`, `ai`
- **Queues**: `bullmq`, `ioredis`
- **Events**: `nats`
- **Storage**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **XML**: `fast-xml-parser`
- **Other**: `zod`, `nanoid`, `uuid`
