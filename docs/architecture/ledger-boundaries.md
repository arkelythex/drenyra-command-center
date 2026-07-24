# Ledger Boundaries e Invariantes

**Última actualización:** 2026-07-24
**Content type:** Specification — F0 Foundation
**North star:** [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)

---

## 1. Invariantes del ledger

Estas reglas NUNCA deben romperse. Son verificadas en cada operación.

### 1.1 Débitos = Créditos

```
Cada asiento contable debe tener débitos = créditos en valor absoluto.
```

Verificado por el motor de posting. Si no se cumple, la transacción se rechaza.

### 1.2 Precisión decimal

```
Todo monto se almacena con precisión decimal exacta.
Expresado en la unidad monetaria más pequeña (céntimos) o usando NUMERIC de PostgreSQL.
```

- TypeScript: `DecimalString` o `Money` value object
- PostgreSQL: `NUMERIC(20,2)`
- Rust: `Decimal` (crate)

### 1.3 Period locking

```
No se puede postear un asiento en un periodo cerrado.
Solo un reapertura explícita (con receipt y aprobación) permite modificaciones.
```

| Estado del periodo | POST permitido | Compensación permitida |
|--------------------|:---:|:---:|
| OPEN | ✅ | ✅ |
| LOCKED | ❌ | ❌ |
| CLOSED | ❌ | ❌ |
| REOPENED | ✅ | ✅ |

### 1.4 Append-only

```
El ledger es inmutable. No se modifican ni eliminan asientos.
Las correcciones se hacen mediante asientos de compensación (compensating entries).
```

### 1.5 Single currency per entry

```
Cada asiento opera en una sola moneda.
Conversiones explícitas requieren tipo de cambio registrado.
```

### 1.6 Scope obligatorio

```
Cada asiento está scoped por: organizationId + companyId + fiscalPeriod.
Sin scope completo, el asiento es rechazado.
```

---

## 2. Modelo de datos

```typescript
interface JournalEntry {
  id: string;
  scope: TenantScope & { fiscalPeriod: string };
  entryDate: string;       // ISO 8601
  description: string;
  lines: JournalLine[];
  status: "draft" | "posted" | "corrected";
  receiptId?: string;      // RED receipt link
  createdAt: string;
  postedAt?: string;
  createdBy: string;
}

interface JournalLine {
  accountCode: string;     // PCGE account
  debit: Money | null;
  credit: Money | null;
  description?: string;
  costCenter?: string;
}
```

---

## 3. Validaciones

| Regla | ¿Dónde se verifica? | Estado |
|-------|---------------------|--------|
| Débitos = Créditos | `packages/domain` | ✅ |
| Precisión decimal | `Money` VO + DB NUMERIC | ✅ |
| Period locking | `packages/domain` | ◌ |
| Append-only (no delete) | DB constraints + API guard | ◌ |
| Scope obligatorio | `scope-resolver` | ⚡ parcial |
| Single currency | `JournalLine` | ◌ |
| Compensating entries | `packages/domain` | ◌ |

---

## 4. Próximos pasos

1. Implementar period locking en domain
2. Agregar compensating entry types
3. Verificar invariantes en cada journal:post
4. Tests de integración para todas las reglas

---

## 5. Referencias

- [Program Taxonomy](../architecture/program-taxonomy.md)
- [Capability Map](../architecture/capability-map.md) — CAP-LEDGER-*
- [Accounting core](../../packages/domain/src/) — domain types existentes
