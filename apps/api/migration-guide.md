# ⚠️ DEPRECATED - Migration Guide (Legacy MVC Approach)

> **⚠️ IMPORTANTE**: Esta guía está obsoleta. El proyecto ha adoptado **Vertical Slice Architecture con Clean Architecture** como estándar.
> 
> **Consultar**: [Guía oficial de migración](../../docs/technical/VERTICAL_SLICE_MIGRATION_GUIDE.md)
>
> Esta guía se mantiene solo para referencia histórica de módulos legacy.

## 🔄 Qué Cambió (Enfoque MVC Legacy - No recomendado)

### Antes (Monolítico - 633 líneas)
```typescript
// apps/api/src/index.ts (TODO EN UN ARCHIVO)

const app = new Elysia()
  .group('/invoices', (app) =>
    app
      .get('/', async ({ query }) => {
        // 50 líneas de lógica...
      })
      .post('/', async ({ body, error }) => {
        // 80 líneas de lógica de negocio...
        const lastInvoice = await db.query.invoices.findFirst(...);
        const nextCorrelative = ...;
        const subtotal = body.items.reduce(...);
        const igvAmount = body.items.reduce(...);
        await db.insert(invoices).values(...);
        // etc...
      })
  )
  .group('/customers', (app) => /* más código */)
  .group('/products', (app) => /* más código */)
  // ... 600+ líneas más
```

### Después (Modular - ~50 líneas por archivo)

```typescript
// apps/api/src/index.ts (ORCHESTRATOR - 300 líneas)
import { invoicesRoutes } from './routes/invoices.routes';
import { customersRoutes } from './routes/customers.routes';

const app = new Elysia()
  .use(invoicesRoutes)
  .use(customersRoutes)
  // ... solo imports y configuración
```

```typescript
// apps/api/src/routes/invoices.routes.ts (20 líneas)
export const invoicesRoutes = new Elysia({ prefix: '/invoices' })
  .get('/', InvoicesController.list)
  .post('/', InvoicesController.create, { body: createInvoiceSchema })
```

```typescript
// apps/api/src/controllers/invoices.controller.ts (60 líneas)
export class InvoicesController {
  static async create({ body, error }: Context) {
    try {
      const invoice = await InvoiceService.create(body);
      return { status: 'success', data: invoice };
    } catch (err: any) {
      return error(500, { status: 'error', message: err.message });
    }
  }
}
```

```typescript
// apps/api/src/services/invoice.service.ts (180 líneas)
export class InvoiceService {
  static async create(data: CreateInvoiceDTO) {
    // 1. Generar numeración
    const { invoiceNumber } = await NumberingService.getNextInvoiceNumber(...);

    // 2. Calcular totales
    const totals = this.calculateTotals(data.items);

    // 3. Insertar en DB
    const [invoice] = await db.insert(invoices).values({...});

    return invoice;
  }

  private static calculateTotals(items: InvoiceItemDTO[]) {
    // Lógica de cálculo separada, testeable
  }
}
```

## 📊 Comparación

| Aspecto | Antes (Monolítico) | Después (Modular) |
|---------|-------------------|-------------------|
| **Archivo principal** | 633 líneas | 300 líneas |
| **Archivos totales** | 1 archivo | 20+ archivos |
| **Testabilidad** | ❌ Difícil | ✅ Fácil |
| **Reutilización** | ❌ No | ✅ Sí |
| **Separación** | ❌ Mezclado | ✅ Clara |
| **Mantenibilidad** | ❌ Baja | ✅ Alta |

## 🚀 Beneficios Inmediatos

### 1. **Testabilidad**
Ahora puedes testear servicios de forma aislada:

```typescript
// tests/services/invoice.service.test.ts
import { InvoiceService } from '../src/services/invoice.service';

describe('InvoiceService', () => {
  it('should calculate totals correctly', () => {
    const items = [
      { quantity: '2', unitPrice: '100', taxType: 'GRAVADO' }
    ];

    const totals = InvoiceService['calculateTotals'](items);

    expect(totals.subtotal).toBe('200.00');
    expect(totals.igvAmount).toBe('36.00');
    expect(totals.totalAmount).toBe('236.00');
  });
});
```

### 2. **Reutilización**
Los services se pueden usar desde cualquier lugar:

```typescript
// En un worker background
import { InvoiceService } from './services/invoice.service';

async function processInvoiceQueue() {
  const invoice = await InvoiceService.create(data);
}

// En un CLI command
import { NumberingService } from './services/numbering.service';

async function resetNumbering() {
  const next = await NumberingService.getNextInvoiceNumber(...);
}
```

### 3. **Claridad**
Ahora es obvio dónde está cada cosa:
- **¿Dónde está la validación de RUC?** → `services/sunat.service.ts`
- **¿Dónde se calculan los totales?** → `services/invoice.service.ts`
- **¿Dónde se define el endpoint POST /invoices?** → `routes/invoices.routes.ts`

## 🔧 Cómo Migrar Código Legacy

### Ejemplo: Migrar `/dashboard` a modular

#### 1. Identificar la lógica de negocio
```typescript
// ANTES: apps/api/src/index.ts (líneas 30-74)
.get('/dashboard/summary', async () => {
  // Lógica de agregación de métricas
  const metrics = await db.select({...}).from(transactions)...;
  // ... 40 líneas más
})
```

#### 2. Extraer a Service
```typescript
// NUEVO: apps/api/src/services/dashboard.service.ts
export class DashboardService {
  static async getSummary() {
    // 1. Aggregations
    const metrics = await db
      .select({
        type: transactions.type,
        total: sql<string>`sum(${transactions.totalAmount})`,
        igv: sql<string>`sum(${transactions.igvAmount})`
      })
      .from(transactions)
      .groupBy(transactions.type);

    const income = metrics.find(m => m.type === 'INCOME');
    const expense = metrics.find(m => m.type === 'EXPENSE');

    const incomeTotal = parseFloat(income?.total || '0');
    const expenseTotal = parseFloat(expense?.total || '0');
    const incomeIgv = parseFloat(income?.igv || '0');
    const expenseIgv = parseFloat(expense?.igv || '0');

    // 2. Recent transactions
    const recent = await db.query.transactions.findMany({
      orderBy: [desc(transactions.issueDate)],
      limit: 5,
      with: { partner: true }
    });

    return {
      financials: {
        totalSales: incomeTotal,
        totalExpenses: expenseTotal,
        netIncome: incomeTotal - expenseTotal,
        igvToPay: Math.max(0, incomeIgv - expenseIgv),
        igvCredit: Math.max(0, expenseIgv - incomeIgv)
      },
      recentTransactions: recent
    };
  }
}
```

#### 3. Crear Controller
```typescript
// NUEVO: apps/api/src/controllers/dashboard.controller.ts
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getSummary() {
    try {
      const data = await DashboardService.getSummary();
      return { status: 'success', ...data };
    } catch (err: any) {
      console.error('Dashboard Error:', err);
      return { status: 'error', message: err.message };
    }
  }

  static async getHealth() {
    try {
      const data = await DashboardService.getHealth();
      return { status: 'success', ...data };
    } catch (err: any) {
      return { status: 'error', message: err.message };
    }
  }
}
```

#### 4. Crear Routes
```typescript
// NUEVO: apps/api/src/routes/dashboard.routes.ts
import { Elysia } from 'elysia';
import { DashboardController } from '../controllers/dashboard.controller';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .get('/summary', DashboardController.getSummary)
  .get('/health', DashboardController.getHealth);
```

#### 5. Registrar en index.ts
```typescript
// apps/api/src/index.ts
import { dashboardRoutes } from './routes/dashboard.routes';

const app = new Elysia()
  .use(dashboardRoutes) // ← Agregar
  // ... otras rutas
```

#### 6. Eliminar código legacy
```typescript
// ANTES: apps/api/src/index.ts
.group('/dashboard', (app) => /* ELIMINAR TODO ESTO */)
```

## ✅ Checklist de Migración

Para cada módulo legacy:

- [ ] **Paso 1**: Identificar endpoints (GET /path, POST /path, etc.)
- [ ] **Paso 2**: Extraer lógica de negocio a `services/*.service.ts`
- [ ] **Paso 3**: Crear `controllers/*.controller.ts` con orquestación
- [ ] **Paso 4**: Crear `validators/*.schema.ts` con schemas
- [ ] **Paso 5**: Crear `routes/*.routes.ts` conectando todo
- [ ] **Paso 6**: Importar route en `index.ts`
- [ ] **Paso 7**: Eliminar código legacy de `index.ts`
- [ ] **Paso 8**: Probar endpoints con Postman/curl
- [ ] **Paso 9**: (Opcional) Agregar tests unitarios

## 🎯 Módulos Pendientes de Migración

### Alta Prioridad
- [ ] `/dashboard` (2 endpoints)
- [ ] `/chat` (3 endpoints)

### Media Prioridad
- [ ] `/transactions` (2 endpoints)
- [ ] `/reconciliations` (1 endpoint)

## 📝 Archivo Backup

El archivo original está guardado en:
```
apps/api/src/index.ts.backup
```

Si algo falla, puedes restaurarlo:
```bash
cd apps/api/src
mv index.ts index.ts.new
mv index.ts.backup index.ts
```

## 🆘 Solución de Problemas

### Problema: "Cannot find module './routes/xyz.routes'"
**Solución**: Asegúrate de haber creado el archivo de routes.

### Problema: Endpoints no responden
**Solución**: Verifica que hayas agregado `.use(xyzRoutes)` en `index.ts`.

### Problema: Errores de TypeScript en Services
**Solución**: Asegúrate de importar correctamente desde `@arkelythex/infrastructure`.

### Problema: "Service is not a function"
**Solución**: Verifica que estés usando métodos estáticos: `MyService.method()`.

## 📚 Recursos

- [README.md](./README.md) - Documentación de la arquitectura
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Elysia Best Practices](https://elysiajs.com/patterns/modular.html)

---

**¿Preguntas?** Revisa el README.md o consulta con el equipo.
