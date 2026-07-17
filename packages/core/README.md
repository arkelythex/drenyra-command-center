---
last-verified: 2026-06-23
---

# @arkelythex/core

ARKELYTHEX OS Platform Core — IAM, Ontology, Platform Events, Persistence.

> **Este paquete es el núcleo de la plataforma ARKELYTHEX OS.** Contiene los tipos compartidos, esquemas de validación, el bus de eventos y el registro de ontología que usan todos los verticales (Drenyra, Andino, Admin, etc.).

## Módulos

| Módulo | Export path | Descripción |
|--------|-------------|-------------|
| IAM | `@arkelythex/core/iam` | Tipos + Zod schemas para usuarios, organizaciones, roles y permisos |
| Ontology | `@arkelythex/core/ontology` | Tipos + Zod schemas + OntologyRegistry para objetos de datos compartidos |
| Events | `@arkelythex/core/events` | `PlatformEventBus` (in-memory) + constantes `PlatformEventTypes` |
| Persistence | `@arkelythex/core/persistence` | `CoreDomainRegistry` para registro de dominios |

## IAM

```typescript
import { CoreUserSchema, CoreOrganizationSchema } from "@arkelythex/core/iam";
import type { CoreUser, CoreOrganization } from "@arkelythex/core/iam";

const user = CoreUserSchema.parse(data);
// user is typed as CoreUser
```

### Tipos disponibles

- `CoreUser` — Usuario de la plataforma
- `CoreOrganization` — Organización/tenant (con RUC, settings, etc.)
- `CoreRole` — Rol con permisos asociados
- `CorePermission` — Permiso granular (domain, resource, action)
- `CoreMembership` — Relación usuario-organización-rol

## Ontology

```typescript
import { OntologyRegistry } from "@arkelythex/core";
import { CoreClientSchema } from "@arkelythex/core/ontology";
import { CoreProductSchema } from "@arkelythex/core/ontology";

const registry = new OntologyRegistry();
registry.register({
  name: "core.client",
  schema: CoreClientSchema,
  owner: "core",
  description: "A client/counterparty",
});

// Validate data against registered schema
const result = registry.validate("core.client", data);
// { success: true, data: CoreClient } | { success: false, error: ZodError }
```

### Objetos de ontología

- `CoreClient` — Cliente/contraparte
- `CoreProduct` — Producto/servicio
- `CoreLocation` — Ubicación (address, farm, warehouse, clinic, airspace)
- `CoreContract` — Contrato entre organización y cliente

Cada tipo tiene su schema Zod para validación runtime y branded IDs para type safety.

## Events (PlatformEventBus)

```typescript
import { PlatformEventBus, PlatformEventTypes } from "@arkelythex/core/events";

const bus = new PlatformEventBus();
const unsub = await bus.subscribe(
  PlatformEventTypes.ClientRegistered,
  (event) => {
    console.log("Client registered:", event.payload);
  },
);

await bus.publish(PlatformEventTypes.ClientRegistered, {
  id: "client_01",
  businessName: "Agricola Los Andes SAC",
  // ...
});

unsub(); // Cleanup
```

### Event types disponibles

| Constante | Tipo de evento |
|-----------|---------------|
| `PlatformEventTypes.ClientRegistered` | `core.client.registered` |
| `PlatformEventTypes.OrganizationCreated` | `core.organization.created` |
| `PlatformEventTypes.UserInvited` | `core.user.invited` |
| `PlatformEventTypes.InvoiceCreated` | `drenyra.invoice.created` |
| `PlatformEventTypes.PaymentReceived` | `drenyra.payment.received` |
| `PlatformEventTypes.ContractSigned` | `administracion.contract.signed` |
| `PlatformEventTypes.EmployeeHired` | `administracion.employee.hired` |
| `PlatformEventTypes.CropHarvested` | `agricultura.crop.harvested` |
| `PlatformEventTypes.FarmRegistered` | `agricultura.farm.registered` |
| `PlatformEventTypes.AppointmentScheduled` | `salud.appointment.scheduled` |
| `PlatformEventTypes.PatientRegistered` | `salud.patient.registered` |
| `PlatformEventTypes.MissionCompleted` | `drones.mission.completed` |
| `PlatformEventTypes.TelemetryReceived` | `drones.telemetry.received` |

### Provider: Redis Streams

En producción, el `PlatformEventBus` tiene un provider Redis Streams en `@arkelythex/infrastructure`:

```typescript
import { RedisStreamsEventBus } from "@arkelythex/infrastructure/event-bus";

const bus = new RedisStreamsEventBus({
  connection: { host: "localhost", port: 6379 },
  streamKey: "platform:events",
  consumerGroup: "os-core",
  consumerName: "instance-1",
  maxLen: 10000,
});
await bus.connect();
```

## Cross-vertical flow

```
Drenyra pinta factura
  → publish(InvoiceCreated, data)
    → Redis Streams (persistencia)
    → PlatformEventBus entrega a suscriptores
      → Andino recibe y actualiza cropCycle.costo
      → Admin recibe y actualiza contract.ingresos
```

## Tests

```bash
cd packages/core
bun run test     # 54 tests, all passing
bun run typecheck
```

## Arquitectura

Este paquete sigue **Vertical Slice + CQRS** sin framework. El dominio es puro TypeScript — sin dependencias de framework más allá de Zod para validación runtime.

```
@arkelythex/core
├── events/         → PlatformEventBus (in-memory)
├── iam/            → IAM types + Zod schemas
├── ontology/       → Ontology types + Zod schemas + OntologyRegistry
├── persistence/    → CoreDomainRegistry
└── index.ts        → Re-exports
```
