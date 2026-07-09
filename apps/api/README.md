---
last-verified: 2026-06-20
source-of-truth: apps/api/package.json
auto-generated: false
---

**Última actualización**: 2026-07-09

> 📖 Documentación bajo la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) — calidez técnica, disclosure progresivo, carga cognitiva reducida. Buscamos que entiendas el *por qué* detrás del código, no solo el *qué*.

# Drenyra API - Financial Intelligence API

**Versión**: 2.1.0 | **Arquitectura**: Vertical Slicing (Elysia + Eden)

---

## Si solo tenés tres minutos

Drenyra API es el backend de Drenyra — la plataforma de inteligencia fiscal peruana. Armamos cada decisión pensando en quien la mantiene después: tipos estrictos, tests donde duelen, y vertical slicing para que cada feature viva sola sin romper las demás.

| Si querés... | Hacé esto |
|--------------|-----------|
| **Correr el servidor** | `cd apps/api && bun run dev` → servidor en `http://localhost:3001` |
| **Explorar endpoints** | Visitá `http://localhost:3001/swagger` |
| **Navegar el código** | Leé [`MAP.md`](./MAP.md) — mapa completo con 42 features |
| **Ver guías de stack** | Revisá [AGENTS.md](../../AGENTS.md) |
| **Stack principal** | Bun 1.x + ElysiaJS 1.4 + Drizzle ORM + PostgreSQL 15 |

Las features viven en `src/features/` — cada una con dominio, rutas y tests propios. Vertical slicing significa que podés leer un feature entero sin saltar entre 20 archivos.

---

## 🎯 **Información SUNAT 2026**

### 📊 **Parámetros Fiscales Actualizados**

| Impuesto | Valor | Notas |
|----------|-------|-------|
| **IGV** | 18% | 14% IGV + 4% IPM (Ley 32387) |
| **UIT** | S/ 5,350 | Unidad Impositiva Tributaria 2026 |
| **SPOT Umbral** | S/ 700.01 | Aplica detracción sobre este monto |
| **SIRE** | Mensual | Cierre día 10 del mes siguiente |

### 🔄 **Facturación Electrónica**

- **Formato**: XML UBL 2.1 con namespaces `cac:` y `cbc:`
- **Firma**: RSA-SHA256 (implementación nativa, 0 deps externas)
- **Plazo**: 7 días calendario desde emisión
- **CPE**: Factura (01), Boleta (03), Nota Crédito (07)

---

## 🏗️ Arquitectura: Vertical Slicing

Elegimos vertical slicing porque un feature fiscal toca muchas capas (ruta → validación → dominio → SUNAT → DB). Si separamos por capas técnicas, un cambio de facturación toca 10 archivos en 8 carpetas. Acá todo lo de una feature está junto, y lo compartido vive aparte.

```text
apps/api/src/
├── features/              # DOMINIOS DE NEGOCIO
│   ├── sunat/            # Integración SUNAT
│   │   ├── signature/    # Firma digital XML
│   │   ├── sire/         # Generación SIRE
│   │   └── index.ts      # Router
│   ├── invoicing/        # Facturación
│   ├── auth/             # BetterAuth
│   ├── inventory/        # Inventario
│   └── inter-company/    # Transacciones
├── shared/               # Utilidades transversales
└── index.ts              # Composición de App
```

### Flujo de un Vertical Slice

1. **`index.ts`**: Define rutas y handlers. Conecta Schemas con Lógica.
2. **`feature.schema.ts`**: Validación TypeBox → Swagger automático.
3. **`feature.service.ts`**: Lógica de negocio pura + Drizzle.

**Beneficios:**
- ✅ Type safety automático con Eden Treaty
- ✅ Co-locación: todo junto cambia junto
- ✅ Testing aislado por feature
- ✅ Escalabilidad: nuevos features no rompen existentes

---

## 📦 Módulos Implementados

### ✅ Core SUNAT (Producción)

| Módulo | Status | Descripción |
|--------|--------|-------------|
| **Firma XML** | ✅ | RSA-SHA256 nativa, certificados X.509 |
| **SIRE Submission** | ✅ | API SUNAT SIRE + modo simulación |
| **SIRE Export** | ✅ | RVIE/RCE en formato TXT/Excel/CSV para contingencia |
| **SPOT Calculator** | ✅ | Detección automática > S/ 700 |
| **Validación RUC** | ✅ | Verificación en tiempo real |
| **Calendario Tributario** | ✅ | Fechas por dígito RUC |

### ✅ Gestión de Negocio

| Módulo | Status | Descripción |
|--------|--------|-------------|
| **Auth** | ✅ | BetterAuth (Login, Signup, Sesiones) |
| **Invoicing** | ✅ | Facturación electrónica completa |
| **Inventory** | ✅ | Kardex, almacenes, movimientos |
| **Multi-RUC** | ✅ | Gestión multi-empresa |
| **Inter-Company** | ✅ | Transacciones entre empresas |

### ⚠️ Legacy (En migración)

| Módulo | Status | Plan |
|--------|--------|------|
| **Banking** | ⚠️ | Migrando a Vertical Slicing |
| **Cashflow** | ⚠️ | Pendiente refactorización |
| **Taxation** | ⚠️ | Parcial (SPOT listo, faltan retenciones) |

---

## 🚀 Comandos

| Comando | Qué hace |
|---------|----------|
| `bun run dev` | Desarrollo con hot reload |
| `bun test` | Tests unitarios e integración (sin DB) |
| `bun run build:binary` | Build single executable para producción |
| `bun run typecheck` | TypeScript strict — obligatorio antes de commit |
| `bun run lint` | ESLint |

---

## 📚 Documentación API

### Swagger UI

Visitá: `http://localhost:3001/swagger`

Documentación interactiva generada automáticamente desde los esquemas TypeBox. Cada schema que definís genera su propia doc — cero trabajo extra.

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/signup` | Registro |
| POST | `/api/auth/signin` | Login |
| GET | `/api/invoices` | Listar facturas |
| POST | `/api/invoices` | Crear factura |
| GET | `/api/invoices/:id/xml` | Obtener XML firmado |
| GET | `/api/sire/sales/:year/:month` | SIRE Ventas |
| GET | `/api/sire/purchases/:year/:month` | SIRE Compras |
| GET | `/api/sunat/validate-ruc/:ruc` | Validar RUC |

### OSE / CDR (Fase 1 desbloqueo)

```bash
# Sandbox rápido (sin credenciales reales)
OSE_PROVIDER=nubefact
OSE_ENV=sandbox
OSE_SIMULATION_MODE=true

# Para webhook CDR seguro (recomendado en producción)
OSE_WEBHOOK_SECRET=replace-with-long-random-secret
```

- Webhook CDR: `POST /electronic-invoicing/webhooks/cdr`
- Guía completa: `docs/guides/deployment/ose-onboarding-sandbox-2026.md`

### Producción 2026

```bash
# Build single binary
bun run build:binary

# Imagen distroless (producción canónica)
docker build -f apps/api/Dockerfile.production -t drenyra-api:prod .

# Deploy a Fly.io usando el manifiesto del repo
bun run deploy:fly

# OpenTelemetry opcional (producción / staging)
DRENYRA_ENABLE_OTEL=true \
OTEL_SERVICE_NAME=drenyra-api \
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.example.com/v1/traces \
bun run dev
```

- Manifiesto Fly.io: `apps/api/fly.toml`
- Dockerfile canónico de producción: `apps/api/Dockerfile.production`
- Compatibilidad legacy: `apps/api/Dockerfile.distroless`
- Diagnóstico local: `GET /health/doctor` ahora reporta `checks.otel`

### CPE 2026: trazabilidad de reglas

- SUNAT publica "Reglas de Validación" con actualización oficial al **2026-02-09**.
- Drenyra expone la baseline activa en `GET /cpe-validator/rules-meta`.
- **Estado actual**: cobertura parcial (estructura UBL + chequeos SUNAT), aún no paridad completa con toda la matriz/XSD.

---

## 🛠️ Crear un Nuevo Módulo

Qué pensamos cuando armamos un módulo nuevo: querés implementar rápido, con typesafety de punta a punta, sin pensar en boilerplate. Acá el molde:

### 1. Crear estructura
```bash
mkdir apps/api/src/features/mymodule
touch apps/api/src/features/mymodule/{index.ts,mymodule.schema.ts,mymodule.service.ts}
```

### 2. Definir Schema (Contrato)
```typescript
// mymodule.schema.ts
import { t } from 'elysia';

export const CreateItemSchema = t.Object({
  name: t.String(),
  amount: t.Number()
});

export type CreateItemType = typeof CreateItemSchema.static;
```

### 3. Implementar Servicio (Lógica)
```typescript
// mymodule.service.ts
export class MyModuleService {
  static async create(data: CreateItemType) {
    // Lógica de negocio
    return { id: generateId(), ...data };
  }
}
```

### 4. Exponer Rutas (Entry Point)
```typescript
// index.ts
import { Elysia } from 'elysia';
import { MyModuleService } from './mymodule.service';
import { CreateItemSchema } from './mymodule.schema';

export const myModule = new Elysia({ prefix: '/mymodule' })
  .post('/', 
    ({ body }) => MyModuleService.create(body), 
    { body: CreateItemSchema }
  )
  .get('/', () => MyModuleService.list());
```

### 5. Registrar en App
```typescript
// apps/api/src/index.ts
import { myModule } from './features/mymodule';

const app = new Elysia()
  .use(myModule)  // ← Listo!
```

**Automáticamente:**
- ✅ Types inferidos para frontend
- ✅ Validación en runtime
- ✅ Swagger documentation
- ✅ End-to-end type safety

---

## 🧪 Testing

Testeamos porque el fisco no perdona errores. Un IVA mal calculado no es un bug — es una multa.

```bash
# Tests unitarios
bun test

# Tests de integración
bun test:integration

# Tests específicos
bun test src/features/sunat/
```

**Ejemplo de test:**
```typescript
// mymodule.test.ts
import { describe, it, expect } from 'bun:test';
import { MyModuleService } from './mymodule.service';

describe('MyModule', () => {
  it('should create item', async () => {
    const result = await MyModuleService.create({ name: 'Test', amount: 100 });
    expect(result.name).toBe('Test');
  });
});
```

> 💡 Si estás tocando lógica fiscal, corré `bun run test:db:compliance` antes de commitear. No esperes a que CI te lo diga.

---

## 🔐 Seguridad

| Capa | Qué hace |
|------|----------|
| **BetterAuth** | Autenticación moderna con sesiones |
| **JWT** | Tokens firmados |
| **Helmet** | Headers de seguridad HTTP |
| **Rate Limiting** | Protección contra brute force |
| **TypeBox** | Validación estricta en todos los endpoints |

Cada endpoint nuevo debería tener validación de input con TypeBox y scope de compañía. Si no tiene, es un bug de seguridad.

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| **Endpoints** | 50+ |
| **Test Coverage** | 80%+ en Core |
| **Type Coverage** | 100% |
| **Tiempo respuesta** | < 100ms (p95) |

---

## 📞 Soporte

- **Issues**: GitHub Issues
- **Docs**: `/docs` en desarrollo
- **Convenciones**: Ver [AGENTS.md](../../AGENTS.md)
- **Filosofía de diseño**: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md)
- **Mapa de navegación**: [`MAP.md`](./MAP.md)

---

**Arquitectura**: Vertical Slicing + Hexagonal  
**Stack**: Bun 1.x + Elysia + Drizzle + PostgreSQL 15  
**Última actualización**: 2026-07-09
