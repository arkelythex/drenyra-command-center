---
last-verified: 2026-06-20
source-of-truth: packages/persistence/package.json
auto-generated: false
---

# @drenyra/persistence — Database Persistence Layer

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 0.1.0 | **ORM**: Drizzle ORM + PostgreSQL

---

## De un vistazo

El paquete **persistence** provee la capa de acceso a base de datos: definiciones de schema Drizzle ORM, implementaciones de repositorio, un patrón unit-of-work y helpers de query. Implementa las interfaces de repositorio declaradas en `@drenyra/domain`.

Si tenés que leer o escribir datos de la base de datos — la implementación está acá. El dominio define el contrato, persistence lo ejecuta.

---

## 📦 Estructura

```text
packages/persistence/src/
├── client.ts           # Cliente de base de datos (conexión postgres.js)
├── query.ts            # Helpers de query
├── unit-of-work.ts     # Wrapper transaccional unit-of-work
├── schema/             # Definiciones de schema Drizzle ORM
│   ├── index.ts        # Barrel export de schemas
│   ├── accounting.schema.ts
│   ├── invoicing.schema.ts
│   ├── taxation.schema.ts
│   ├── banking-core.schema.ts
│   ├── transactions.schema.ts
│   ├── auth.schema.ts
│   ├── documents.schema.ts
│   ├── security.schema.ts
│   ├── sire.schema.ts
│   ├── inventory.schema.ts
│   ├── products.schema.ts
│   ├── assets.schema.ts
│   ├── payroll.schema.ts
│   ├── enums.ts
│   ├── core.schema.ts
│   ├── business-partners.schema.ts
│   ├── chat.schema.ts
│   ├── ai-settings.schema.ts
│   ├── ai-control-plane.schema.ts
│   ├── ai-worker-queues.schema.ts
│   ├── fiscal-memory.schema.ts
│   ├── fiscal-truth.schema.ts
│   ├── drenyra-command-center.schema.ts
│   ├── economic-groups.schema.ts
│   ├── platform-mcp.schema.ts
│   ├── telemetry.schema.ts
│   ├── auxiliary.schema.ts
│   ├── schema-extensions.ts
│   └── __tests__/
├── repositories/       # Implementaciones de repositorio
│   ├── postgres-account.repository.ts
│   ├── postgres-invoice.repository.ts
│   ├── postgres-document.repository.ts
│   ├── postgres-journal-entry.repository.ts
│   ├── postgres-transaction.repository.ts
│   ├── postgres-bank-account.repository.ts
│   ├── postgres-bank-transaction.repository.ts
│   ├── postgres-bank-reconciliation.repository.ts
│   ├── postgres-client.repository.ts
│   ├── postgres-provider.repository.ts
│   ├── postgres-ai-settings.repository.ts
│   ├── postgres-accounting-period.repository.ts
│   ├── postgres-detraction.repository.ts
│   ├── postgres-exchange-rate.repository.ts
│   ├── postgres-cpe-log.repository.ts
│   ├── postgres-drenyra.repository.ts
│   ├── postgres-evidence-graph.repository.ts
│   ├── postgres-fiscal-truth.repository.ts
│   ├── postgres-fiscal-memory.repository.ts
│   ├── postgres-replay.repository.ts
│   ├── postgres-platform-mcp-audit.repository.ts
│   ├── sire-submission.repository.ts
│   ├── support/
│   └── __tests__/ (con setup de tests de integración)
├── seed/               # Scripts de datos semilla
├── services/           # Servicios a nivel de persistencia
├── PostgresReportDataSource.ts
└── index.ts            # API pública
```

### Cobertura de Schemas

30+ schemas Drizzle ORM cubriendo:

| Dominio | Schemas |
|---------|---------|
| **Contabilidad** | `accounting`, `core`, `transactions` |
| **Facturación** | `invoicing`, `documents`, `business-partners` |
| **Banca** | `banking-core`, `banking`, `banking-reconciliation-matches` |
| **Impuestos** | `taxation`, `sire`, `fiscal-memory`, `fiscal-truth` |
| **Auth** | `auth`, `security` |
| **IA** | `ai-settings`, `ai-control-plane`, `ai-worker-queues` |
| **Inventario** | `inventory`, `products` |
| **Plataforma** | `platform-mcp`, `telemetry`, `chat`, `drenyra-command-center` |
| **Otros** | `assets`, `payroll`, `economic-groups`, `auxiliary` |

### Unit of Work

El `unit-of-work.ts` provee garantías transaccionales:

- Wrapea múltiples operaciones de repositorio en una sola transacción de DB
- Rollback automático en caso de error
- Soporte para operaciones anidadas vía savepoints

---

## 🚀 Scripts

```bash
cd packages/persistence
bun run typecheck       # TypeScript type check
bun run test            # Ejecutar tests (bun test)
```

---

## 🔗 Dependencias

- **Runtime**: `@drenyra/domain`, `@drenyra/application`, `@drenyra/shared`, `drizzle-orm`, `postgres`, `uuid`
- **Dev**: TypeScript ^6.0.3
