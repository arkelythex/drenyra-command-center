/**
 * Customer Feature
 *
 * Customer management with SUNAT RUC validation.
 *
 * @module customer
 */

# 👥 Customer Feature

**Status:** ✅ Migrated to Vertical Slice
**Version:** 1.0.0
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

Customer management for Peruvian businesses with SUNAT compliance.

**Key Features:**
- ✅ RUC validation (SUNAT Módulo 11)
- ✅ CRUD operations
- ✅ Credit management
- ✅ Compliance scoring
- ✅ Invoice history
- ✅ Soft delete

---

## Architecture

### Vertical Slice Structure

```
features/customer/
├── api/                # Elysia routes + Zod validation
│   └── routes.ts
├── application/        # Commands + Queries (CQRS)
│   ├── commands/
│   │   ├── create-customer.command.ts
│   │   ├── update-customer.command.ts
│   │   └── delete-customer.command.ts
│   └── queries/
│       ├── list-customers.query.ts
│       └── get-customer.query.ts
├── domain/             # Entity + Business Logic
│   └── customer.ts
└── __tests__/          # Unit tests
    └── unit/customer.test.ts
```

---

## Domain Model

### Customer Entity

```typescript
class Customer {
  id: string;
  companyId: string;
  taxId: string; // RUC (11 digits)
  legalName: string;
  email?: string;
  address?: string; // TODO: Add to schema
  phone?: string; // TODO: Add to schema
  creditLimit?: number; // TODO: Add to schema
  creditDays?: number; // TODO: Add to schema
  complianceScore: number;
  sunatCondition: string; // HABIDO, INACTIVO
  logoUrl?: string;
  createdAt: Date;

  // Computed properties
  get isActive(): boolean
  get isInactive(): boolean
  get hasGoodCompliance(): boolean

  // Business methods
  hasCreditAvailable(currentDebt: number): boolean
  getRemainingCredit(currentDebt: number): number
  static isValidRUC(ruc: string): boolean
}
```

---

## API Endpoints

### `POST /api/customers`

Create a new customer.

**Request:**
```json
{
  "companyId": "company-1",
  "taxId": "20123456789",
  "legalName": "Empresa Demo SAC",
  "email": "contacto@demo.com",
  "address": "Av. Principal 123",
  "phone": "987654321",
  "creditLimit": 10000,
  "creditDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "customer-1",
    "companyId": "company-1",
    "taxId": "20123456789",
    "legalName": "Empresa Demo SAC",
    "email": "contacto@demo.com",
    "complianceScore": 100,
    "sunatCondition": "HABIDO",
    "isActive": true,
    "hasGoodCompliance": true,
    "createdAt": "2026-02-04T10:00:00Z"
  }
}
```

**Validation:**
- RUC must be exactly 11 digits
- RUC must pass SUNAT Módulo 11 algorithm
- Legal name is required

---

### `GET /api/customers`

List all customers for a company.

**Query Params:**
```typescript
{
  companyId: string;
  includeInactive?: boolean; // Default: false
}
```

**Example:**
```bash
curl "http://localhost:3000/api/customers?companyId=company-1"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-1",
      "taxId": "20123456789",
      "legalName": "Empresa Demo SAC",
      "email": "contacto@demo.com",
      "complianceScore": 100,
      "sunatCondition": "HABIDO",
      "isActive": true,
      "hasGoodCompliance": true,
      "createdAt": "2026-02-04T10:00:00Z"
    }
  ]
}
```

---

### `GET /api/customers/:id`

Get a single customer by ID.

**Query Params:**
```typescript
{
  includeInvoices?: boolean; // Default: false
  invoiceLimit?: number; // Default: 10, max: 100
}
```

**Example:**
```bash
curl "http://localhost:3000/api/customers/customer-1?includeInvoices=true&invoiceLimit=5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "customer-1",
      "taxId": "20123456789",
      "legalName": "Empresa Demo SAC",
      "isActive": true,
      "hasGoodCompliance": true
    },
    "invoices": [
      {
        "id": "inv-1",
        "invoiceNumber": "F001-00001",
        "issueDate": "2026-02-01",
        "dueDate": "2026-03-01",
        "totalAmount": 1180.00,
        "status": "SENT"
      }
    ]
  }
}
```

---

### `PATCH /api/customers/:id`

Update a customer.

**Request:**
```json
{
  "legalName": "Empresa Demo SAC - Actualizado",
  "email": "nuevo@demo.com",
  "creditLimit": 15000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "customer-1",
    "legalName": "Empresa Demo SAC - Actualizado",
    "email": "nuevo@demo.com"
  }
}
```

---

### `DELETE /api/customers/:id`

Soft-delete a customer (marks as INACTIVO).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "customer-1",
    "sunatCondition": "INACTIVO",
    "isActive": false
  },
  "message": "Cliente marcado como inactivo (soft delete)"
}
```

**Important:**
- Customer is NOT physically deleted (audit purposes)
- Related invoices remain unchanged
- Can be reactivated by updating sunatCondition to HABIDO

---

## Usage Examples

### Create customer with RUC validation

```typescript
const command = new CreateCustomerCommand();

try {
  const customer = await command.execute({
    companyId: 'company-1',
    taxId: '20123456789',
    legalName: 'Empresa Demo SAC',
    email: 'contacto@demo.com',
  });

  console.log('✅ Customer created:', customer.id);
} catch (error) {
  console.error('❌ Invalid RUC:', error.message);
}
```

### Check credit availability

```typescript
const query = new GetCustomerQuery();
const { customer } = await query.execute({ id: 'customer-1' });

const currentDebt = 7500; // From invoices

if (customer.hasCreditAvailable(currentDebt)) {
  const remaining = customer.getRemainingCredit(currentDebt);
  console.log(`✅ Credit available: S/ ${remaining}`);
} else {
  console.log('⚠️ Credit limit exceeded');
}
```

---

## Testing

```bash
# Run customer tests
bun test src/features/customer/__tests__/unit/

# Expected: All tests passing
```

---

## Migration Notes

### Changes from Legacy

**Before (Legacy):**
- ❌ Static service class
- ❌ No domain entity
- ❌ Limited validation
- ❌ No credit management logic
- ❌ No tests

**After (Vertical Slice):**
- ✅ CQRS pattern (Commands + Queries)
- ✅ Rich domain model (Customer entity)
- ✅ Zod validation on routes
- ✅ Business logic in domain (credit, compliance)
- ✅ Unit tests
- ✅ Type-safe
- ✅ JSDoc documentation

---

## TODO / Roadmap

### Phase 1 (Current) ✅
- [x] Basic CRUD
- [x] RUC validation
- [x] Soft delete
- [x] Domain entity with business logic

### Phase 2 (Next)
- [ ] Add missing fields to schema (address, phone, creditLimit, creditDays)
- [ ] SUNAT API integration (auto-lookup RUC data)
- [ ] Customer credit history tracking
- [ ] Integration tests

### Phase 3 (Future)
- [ ] Customer analytics (top customers, payment trends)
- [ ] Credit scoring algorithm
- [ ] Customer segmentation
- [ ] Duplicate detection (same RUC in multiple companies)

---

## References

- [Invoice Feature](../invoice/README.md) - Uses Customer
- [Bill Feature](../bill/README.md) - Uses Vendor (same table)
- [Vertical Slice Guide](../../../../docs/technical/vertical-slice-migration-guide.md)

---

**© 2026 ARKELYTHEX - Neural-Symbolic Financial Governance**

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
