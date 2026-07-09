# Test Patterns — Mocking External Services

**Última actualización:** 2026-07-09

## Principios

1. **NO mockear el dominio**: Las reglas fiscales (IGV, detracciones, RUC) deben testearse con objetos reales, no mocks
2. **Mockear adaptadores**: SUNAT, APIs externas, bases de datos, file system
3. **Mockear en la capa de puerto**: Usar las interfaces de `packages/application/src/ports/`, no las implementaciones concretas

## Patrones

### 1. Mock de SUNAT API

```typescript
import { vi } from 'vitest'
import type { SunatApiClient } from '@drenyra/infrastructure'

function createMockSunatClient(): SunatApiClient {
  return {
    consultarRUC: vi.fn().mockResolvedValue({
      ruc: '20123456789',
      razonSocial: 'EMPRESA SAC',
      estado: 'ACTIVO',
      condicion: 'HABIDO',
    }),
    consultarDetraccion: vi.fn().mockResolvedValue({
      monto: 500_00,
      codigoSPOT: '014',
      depositado: true,
    }),
  }
}
```

### 2. Mock de Repositorio

```typescript
import type { InvoiceRepository } from '@drenyra/domain'

function createMockInvoiceRepo(): InvoiceRepository {
  const invoices = new Map<string, Invoice>()

  return {
    findById: vi.fn(async (id) => invoices.get(id) ?? null),
    save: vi.fn(async (invoice) => {
      invoices.set(invoice.id, invoice)
    }),
    delete: vi.fn(async (id) => invoices.delete(id)),
  }
}
```

### 3. Mock de Base de Datos (Drizzle)

```typescript
import { vi } from 'vitest'

function createMockDb() {
  return {
    query: {
      invoices: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi
      .fn()
      .mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: vi.fn() }),
      }),
    update: vi
      .fn()
      .mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
  }
}
```

### 4. Mock de LLM / AI

```typescript
function createMockLLM(): LanguageModel {
  return {
    provider: 'test',
    modelId: 'test-model',
    generateText: vi.fn().mockResolvedValue({
      text: 'Respuesta simulada',
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  } as unknown as LanguageModel
}
```

## Herramientas

- `vitest` `vi.fn()` y `vi.spyOn()` para mocks funcionales
- `vi.mock()` para module-level mocking (evitar si es posible — preferir DI)
- NO usar `sinon` o `jest.mock` — todo con Vitest API

## Anti-patrones

| Anti-patrón                                               | Problema                            | Alternativa                           |
| --------------------------------------------------------- | ----------------------------------- | ------------------------------------- |
| Mockear `Money`                                           | Pierde validaciones de dominio      | Usar `Money.fromCents()` real         |
| Mockear `RUC.create()`                                    | No valida checksum                  | Usar RUC.create() real                |
| Mock demasiado permisivo (`mockResolvedValue(undefined)`) | Oculta errores                      | Usar valores realistas                |
| `vi.mock()` de módulo completo                            | Acopla test a estructura de imports | Inyectar mock via constructor/función |
