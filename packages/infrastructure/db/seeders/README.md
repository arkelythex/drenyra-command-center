# 🌱 Database Seeders

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../../../docs/meta/gentleman-philosophy.md)

Datos semilla realistas para desarrollo y demos de ARKELYTHEX.

## Quick Start

```bash
# Ejecutar seeders
bun run seed

# Resetear base de datos y seedear
bun run seed:reset
```

## Datos Sembrados

### Companies (1)

| Campo | Valor |
|-------|-------|
| Nombre | **ARKELYTHEX PERU SAC** |
| RUC | 20123456789 |
| Compliance Score | 95% |
| SUNAT Status | ACTIVO |

### Customers (5)

Empresas peruanas realistas: CORPORACION WONG SA, SUPERMERCADOS PERUANOS SA, GLORIA SA, BACKUS Y JOHNSTON SAA, ALICORP SAA.

### Products (5)

| Producto | Precio |
|----------|--------|
| Servicio de Consultoría Empresarial | S/ 250/hora |
| Desarrollo de Software a Medida | S/ 180/hora |
| Soporte Técnico Mensual | S/ 1,500/mes |
| Licencia Software ERP | S/ 12,000/año |
| Capacitación Corporativa | S/ 2,500/día |

### Invoices (20)

| Característica | Valor |
|----------------|-------|
| Series | F001 |
| Rango de fechas | Enero 2026 |
| Distribución de estados | 75% PAID, 15% SENT, 10% OVERDUE |
| Revenue total | ~S/ 150,000 |

### Bills (10)

- Vendors: 2
- Status: 7 PAID, 3 PENDING
- Total Expenses: ~S/ 30,000

### Payments (15)

- Methods: Transfer, Check, Cash
- Todos vinculados a facturas pagadas

## Características de los datos

### Valores realistas

- ✅ RUCs peruanos válidos (11 dígitos)
- ✅ Cálculos de IGV 18%
- ✅ Secuencias de fecha correctas
- ✅ Precisión monetaria (4 decimales)

### Lógica de negocio

- ✅ Facturas tienen items correspondientes
- ✅ Facturas pagadas tienen payments
- ✅ Estado SUNAT para facturas enviadas
- ✅ Precios de productos realistas

### Demo-Ready

- ✅ Dashboard muestra métricas reales
- ✅ Charts tienen datos significativos
- ✅ Reportes se generan correctamente
- ✅ Búsqueda y filtros funcionan

## Personalización

Editá `seeders/index.ts` para:

- Agregar más companies
- Customizar el catálogo de productos
- Ajustar cantidades de facturas
- Cambiar rangos de fecha
- Modificar distribución de estados

## Notas

- Los seeders usan **RUCs de empresas peruanas reales** para realismo
- Todos los cálculos monetarios usan la clase `Money` para precisión
- Los números de factura siguen formato SUNAT (SERIE-CORRELATIVO)
- Las fechas están en Enero 2026 para consistencia
