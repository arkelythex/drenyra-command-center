# 💰 Cashflow Feature

**Status:** ✅ Migrated to Vertical Slice
**Version:** 2.0.0
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

---

## Overview

Cash flow projection and forecasting for Peruvian businesses.

**Key Features:**
- ✅ Projection (inflows + outflows)
- ✅ Actual historical cashflow
- ✅ Forecasting (historical trending)
- ✅ Variance analysis (projected vs actual)
- ✅ Weekly breakdown
- ✅ Overdue detection
- ✅ Multi-currency support (PEN, USD)

---

## Architecture

### Vertical Slice Structure

```
features/cashflow/
├── api/               # Elysia routes + DTOs
│   └── routes.ts
├── application/       # Queries (CQRS)
│   └── queries/
│       └── get-cashflow-projection.query.ts
├── domain/           # Entities + Value Objects
│   └── cashflow-projection.ts
├── infrastructure/   # Repositories
└── __tests__/       # Unit tests
```

---

## Domain Model

### CashflowProjection

Represents projected cashflow for a period:

```typescript
class CashflowProjection {
  companyId: string;
  startDate: Date;
  endDate: Date;
  currency: Currency;
  inflows: CashflowItem[];
  outflows: CashflowItem[];

  // Computed
  get totalInflows(): Money
  get totalOutflows(): Money
  get netCashflow(): Money
  get isDeficit(): boolean
  get overdueItems(): CashflowItem[]

  // Methods
  getItemsDueWithin(days: number): CashflowItem[]
  getWeeklyBreakdown(): WeeklyBreakdown[]
}
```

### CashflowItem

Represents an invoice or bill:

```typescript
interface CashflowItem {
  id: string;
  type: 'inflow' | 'outflow';
  documentType: 'invoice' | 'bill';
  reference: string;
  amount: Money;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'paid';
  customerOrVendor: string;
}
```

---

## API Endpoints

### `GET /api/cashflow/projection`

Get cashflow projection for a period.

**Query Params:**
```typescript
{
  companyId: string;
  days?: number;        // Default: 30
  currency?: 'PEN' | 'USD'; // Default: 'PEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-1",
    "period": {
      "startDate": "2026-02-04",
      "endDate": "2026-03-06"
    },
    "currency": "PEN",
    "summary": {
      "totalInflows": 15000.00,
      "totalOutflows": 8000.00,
      "netCashflow": 7000.00,
      "isDeficit": false
    },
    "inflows": [
      {
        "id": "inv-1",
        "type": "inflow",
        "documentType": "invoice",
        "reference": "F001-123",
        "amount": 1180.00,
        "dueDate": "2026-02-15",
        "status": "pending",
        "customerOrVendor": "Cliente ABC SAC"
      }
    ],
    "outflows": [
      {
        "id": "bill-1",
        "type": "outflow",
        "documentType": "bill",
        "reference": "B001-456",
        "amount": 590.00,
        "dueDate": "2026-02-20",
        "status": "pending",
        "customerOrVendor": "Proveedor XYZ EIRL"
      }
    ],
    "overdueItems": 2,
    "weeklyBreakdown": [
      {
        "weekStart": "2026-02-03",
        "weekEnd": "2026-02-09",
        "inflows": 5000.00,
        "outflows": 2000.00,
        "netCashflow": 3000.00
      }
    ]
  }
}
```

---

### `GET /api/cashflow/actual`

Get actual historical cashflow from bank transactions.

**Query Params:**
```typescript
{
  companyId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  currency?: 'PEN' | 'USD';
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-1",
    "period": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    },
    "currency": "PEN",
    "actualInflows": 12000.00,
    "actualOutflows": 7500.00,
    "netCashflow": 4500.00,
    "transactionCount": {
      "inflows": 18,
      "outflows": 11
    }
  }
}
```

---

### `GET /api/cashflow/forecast`

Get cashflow forecast based on historical bank transaction trends.

**Query Params:**
```typescript
{
  companyId: string;
  months?: number; // Default: 3
  currency?: 'PEN' | 'USD';
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-1",
    "months": 3,
    "forecast": [
      {
        "month": "2026-03",
        "expectedInflows": 15000.00,
        "expectedOutflows": 8000.00,
        "netCashflow": 7000.00,
        "confidence": 0.85
      }
    ]
  }
}
```

---

### `GET /api/cashflow/variance`

Compare projected vs actual cashflow.

**Query Params:**
```typescript
{
  companyId: string;
  startDate: string;
  endDate: string;
  currency?: 'PEN' | 'USD';
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-1",
    "period": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    },
    "projected": {
      "inflows": 15000.00,
      "outflows": 8000.00,
      "netCashflow": 7000.00
    },
    "actual": {
      "inflows": 12000.00,
      "outflows": 7500.00,
      "netCashflow": 4500.00
    },
    "variance": {
      "inflows": -3000.00,
      "outflows": -500.00,
      "netCashflow": -2500.00,
      "inflowsPercentage": -20.0,
      "outflowsPercentage": -6.25
    }
  }
}
```

---

## Usage Examples

### Get 30-day projection

```bash
curl "http://localhost:3000/api/cashflow/projection?companyId=company-1&days=30"
```

### Get projection with overdue alerts

```typescript
const projection = await query.execute({
  companyId: 'company-1',
  days: 30,
  currency: 'PEN',
});

if (projection.isDeficit) {
  console.warn('⚠️ Projected deficit:', projection.netCashflow.getAmount());
}

if (projection.overdueItems.length > 0) {
  console.warn(`⚠️ ${projection.overdueItems.length} overdue items`);
}
```

### Weekly breakdown

```typescript
const weekly = projection.getWeeklyBreakdown();

weekly.forEach(week => {
  console.log(`Week ${week.weekStart.toISOString()}:`);
  console.log(`  Inflows: ${week.inflows.getAmount()}`);
  console.log(`  Outflows: ${week.outflows.getAmount()}`);
  console.log(`  Net: ${week.netCashflow.getAmount()}`);
});
```

---

## Testing

```bash
# Run cashflow tests
bun test src/features/cashflow/__tests__/unit/

# Expected: All tests passing
```

---

## Migration Notes

### Changes from Legacy

**Before (Legacy):**
- ❌ Static service class
- ❌ No domain entities
- ❌ No validation
- ❌ Incomplete (no outflows)
- ❌ No tests

**After (Vertical Slice):**
- ✅ CQRS pattern (Queries)
- ✅ Rich domain model (CashflowProjection)
- ✅ Zod validation on routes
- ✅ Complete (inflows + outflows)
- ✅ Unit tests
- ✅ Type-safe
- ✅ JSDoc documentation

---

## Roadmap

### ✅ Phase 1 (Current)
- [x] Projection with inflows + outflows
- [x] Weekly breakdown
- [x] Overdue detection
- [x] Vertical Slice migration

### ✅ Phase 2
- [x] Actual cashflow query (bank-based historical data)
- [x] Variance analysis
- [x] Forecasting with trends from bank transactions
- [ ] Integration tests

### 🚀 Phase 3 (Future)
- [ ] AI-powered forecasting (Agent Swarm)
- [ ] Cash flow statements (formato SUNAT)
- [ ] Multi-currency automatic conversion
- [ ] Dashboard integration

---

## References

- [Banking Feature](../banking/README.md) - Similar Vertical Slice pattern
- [Invoice Feature](../invoice/README.md) - Inflows source
- [Bill Feature](../bill/README.md) - Outflows source
- [Vertical Slice Guide](../../../docs/technical/vertical-slice-migration-guide.md)

---

**© 2026 ARKELYTHEX - Neural-Symbolic Financial Governance**

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
