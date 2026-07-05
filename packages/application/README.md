---
last-verified: 2026-06-20
source-of-truth: packages/application/package.json
auto-generated: false
---

# @drenyra/application — Application Layer

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 1.0.0 | **Dependencias**: @drenyra/domain, @drenyra/shared

---

## De un vistazo

La capa de **aplicación** orquesta casos de uso, define DTOs y declara puertos (interfaces) para los adaptadores de infraestructura. Es el puente entre el dominio puro y el mundo exterior, sin depender de infraestructura directamente.

Pensalo así: el dominio sabe **qué** hacer, la aplicación sabe **cuándo y en qué orden** hacerlo, y la infraestructura sabe **cómo** hacerlo.

---

## 📦 Estructura

```text
packages/application/src/
├── use-cases/          # Casos de uso (handlers CQRS command/query)
│   ├── invoice/        # Casos de uso de facturación
│   ├── document/       # Casos de uso de documentos
│   ├── account/        # Casos de uso de cuentas contables
│   ├── journal/        # Casos de uso de asientos contables
│   ├── transaction/    # Casos de uso de transacciones
│   ├── client/         # Casos de uso de clientes
│   ├── bank-account/   # Casos de uso de cuentas bancarias
│   ├── bank-transaction/ # Casos de uso de transacciones bancarias
│   ├── ai-settings/    # Casos de uso de configuración de IA
│   └── ...
├── services/           # Servicios de aplicación
│   ├── FinancialReportsService  # Generación de reportes financieros
│   ├── ReconciliationEngine     # Motor de conciliación bancaria
│   ├── accounting-period.service.ts
│   ├── detraction.service.ts
│   ├── exchange-rate.service.ts
│   ├── cpe-tracking.service.ts
│   ├── fiscal-memory.service.ts
│   ├── recurring-error.service.ts
│   └── financial-reports.*.generator.ts  # Generadores de reportes
├── dtos/               # Data Transfer Objects
│   ├── invoice/        # DTOs de factura
│   ├── document/       # DTOs de documento
│   ├── journal/        # DTOs de asiento
│   ├── account/        # DTOs de cuenta
│   ├── ai-settings/    # DTOs de configuración de IA
│   ├── ai-control-plane/ # DTOs de plano de control de IA
│   └── ai-context-control-plane/
├── ports/              # Interfaces de puertos (adaptadores driven)
│   ├── ai-extraction.port.ts
│   ├── ai-provider.port.ts
│   ├── document-processing.port.ts
│   ├── IOcrService.ts
│   ├── IValidationService.ts
│   └── storage.port.ts
├── validators/         # Validadores de input
│   ├── document/
│   └── invoice/
├── fiscal-truth/       # Lógica de verdad fiscal
├── drenyra/            # Lógica específica de Drenyra
│   ├── service.ts / service.test.ts
│   ├── repository.ts
│   ├── brain-evidence-bridge.ts
│   ├── fiscal-work-inspect.service.ts
│   ├── in-memory-repository.ts
│   └── mock-agents.ts
├── lib/                # Utilidades de aplicación
└── index.ts            # API pública
```

### Servicios Clave

| Servicio | ¿Qué hace? | ¿Dónde se usa? |
|----------|------------|----------------|
| `FinancialReportsService` | Genera balance general, estado de resultados, balance de comprobación, libro mayor | Reportes financieros |
| `ReconciliationEngine` | Empareja transacciones bancarias contra asientos contables | Módulo de conciliación |
| `detraction.service.ts` | Cálculo y validación de detracciones SPOT | Facturación / Compras |
| `exchange-rate.service.ts` | Aplicación y conversión de tipo de cambio | Contabilidad |
| `accounting-period.service.ts` | Gestión y validación de periodos contables | Cierre contable |
| `fiscal-memory.service.ts` | Operaciones de memoria fiscal | Drenyra |
| `cpe-tracking.service.ts` | Tracking del ciclo de vida de CPE | Facturación electrónica |

### Puertos

| Puerto | Adaptador Esperado |
|--------|-------------------|
| `ai-extraction.port.ts` | Extracción de datos de documentos vía IA |
| `ai-provider.port.ts` | Abstracción de proveedor de modelo de IA |
| `document-processing.port.ts` | Pipeline de ingestión de documentos |
| `IOcrService.ts` | Extracción de texto vía OCR |
| `IValidationService.ts` | Validación de documentos |
| `storage.port.ts` | Almacenamiento de archivos/blobs |

---

## 🚀 Scripts

```bash
cd packages/application
bun run typecheck    # TypeScript type check (tsconfig.typecheck.json)
bun run test         # Ejecutar tests (Vitest)
```

---

## 🔗 Dependencias

- **Runtime**: `@drenyra/domain`, `@drenyra/shared`
- **Dev**: TypeScript ^6.0.3, Vitest ^4.1.7

---

## 📋 Reglas de Diseño

| Regla | Por qué |
|-------|---------|
| Depende solo de `@drenyra/domain` y `@drenyra/shared` | Mantiene la arquitectura limpia y testeable |
| Nunca depende de infraestructura, web framework o DB | Los puertos invierten la dependencia |
| Todo I/O externo va a través de interfaces de puerto | Podés mockear cualquier adaptador |
| Los casos de uso son stateless | Testeables con puertos mockeados |
| Los DTOs son objetos planos — sin lógica de dominio | Separación clara de responsabilidades |
