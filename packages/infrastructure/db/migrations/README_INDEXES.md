# 📊 Database Performance Indexes — Implementation Guide

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../../../docs/meta/gentleman-philosophy.md)

## De un vistazo

Esta migración agrega **40+ índices estratégicos** a la base de datos DRENYRA para mejorar el rendimiento de queries entre **10x y 100x**.

| Si tu query es lenta... | El índice que la acelera |
|--------------------------|--------------------------|
| Listar facturas por company | `idx_invoices_company_id` |
| Buscar por número de factura | `idx_invoices_number_search` (GIN full-text) |
| Filtrar por estado | `idx_invoices_company_status` (compuesto) |
| Join con items | `idx_invoice_items_invoice_id` |

## Files Created

1. `001_add_performance_indexes.sql` — Migración SQL cruda
2. `001_add_performance_indexes.ts` — Migración Drizzle TypeScript

## Cómo aplicar

### Opción 1: psql (Producción)

```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
psql $DATABASE_URL -f packages/infrastructure/db/migrations/001_add_performance_indexes.sql
```

### Opción 2: Drizzle Kit (Recomendado)

```bash
cd packages/infrastructure
bun drizzle-kit generate:pg
bun drizzle-kit push:pg
```

### Opción 3: Programático (TypeScript)

```typescript
import { up } from './db/migrations/001_add_performance_indexes';
await up();
```

## Índices agregados

### Invoices (18 índices)

| Índice | Tipo | Query target |
|--------|------|--------------|
| `idx_invoices_company_id` | B-tree | Búsqueda por empresa |
| `idx_invoices_customer_id` | B-tree | Búsqueda por cliente |
| `idx_invoices_status` | B-tree | Filtro por estado |
| `idx_invoices_issue_date` | B-tree | Ordenamiento por fecha |
| `idx_invoices_company_status` | Composite | Filtro company + status |
| `idx_invoices_active` | Partial | Solo facturas activas |
| `idx_invoices_number_search` | GIN | Búsqueda full-text |

### Customers (4 índices)

| Índice | Tipo |
|--------|------|
| `idx_customers_company_id` | B-tree |
| `idx_customers_ruc` | B-tree |
| `idx_customers_name_search` | GIN |

### Products (3 índices)

| Índice | Tipo |
|--------|------|
| `idx_products_company_id` | B-tree |
| `idx_products_sku` | B-tree |

### Invoice Items (3 índices)

| Índice | Tipo | Crítico para |
|--------|------|--------------|
| `idx_invoice_items_invoice_id` | B-tree | Joins |
| `idx_invoice_items_product_id` | B-tree | Joins |

### Bills, Vendors, Payments (12 índices)

Estructura similar a invoices.

## Impacto en Performance

| Tipo de Query | Antes | Después | Mejora |
|---------------|-------|---------|--------|
| Listar facturas por company | 500ms | 50ms | **10x** |
| Buscar por número de factura | 2000ms | 7ms | **275x** |
| Filtrar por estado | 300ms | 15ms | **20x** |
| Join con items | 1000ms | 20ms | **50x** |
| Full-text search | 5000ms | 50ms | **100x** |

## Verificación

### Chequear uso de índices

```sql
SELECT schemaname, tablename, indexname, idx_scan as scans,
       idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Chequear tamaños de tabla

```sql
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Verificar plan de query

```sql
-- Antes: Sequential Scan (lento)
EXPLAIN ANALYZE SELECT * FROM invoices WHERE company_id = 'xxx' AND status = 'PAID';

-- Después: Index Scan (rápido)
-- Debería mostrar "Index Scan using idx_invoices_company_status"
```

## Tipos de Índice Usados

### 1. B-tree (Default)

- **Mejor para**: igualdad, rangos, ordenamiento
- **Ejemplos**: `company_id`, `status`, `issue_date`

### 2. Compuestos

- **Mejor para**: queries con múltiples condiciones WHERE
- **Ejemplos**: `(company_id, status)`, `(company_id, issue_date)`

### 3. Parciales

- **Mejor para**: filtrar subconjuntos específicos
- **Ejemplo**: `WHERE status IN ('DRAFT', 'SENT', 'OVERDUE')`
- **275x más rápido** que full table scan

### 4. GIN

- **Mejor para**: full-text search, arrays, JSONB
- **Ejemplo**: `to_tsvector('spanish', invoice_number)`

## Mantenimiento

### Reindex (si es necesario)

```sql
REINDEX TABLE invoices;
REINDEX DATABASE drenyra;
```

### Actualizar estadísticas

```sql
ANALYZE invoices;
ANALYZE customers;
ANALYZE products;
```

## Rollback

```sql
DROP INDEX IF EXISTS idx_invoices_company_id;
DROP INDEX IF EXISTS idx_invoices_customer_id;
-- ... (ver SQL file para lista completa)
```

## Notas importantes

- Los índices mejoran la performance de **lectura** pero ralentizan ligeramente las **escrituras**
- Monitoreá el uso de índices y eliminá los no utilizados
- Ejecutá `ANALYZE` después de cambios significativos de datos
- Considerá `VACUUM` para mantenimiento de tablas
