import type { NavigationPattern } from './types';

export const NAVIGATION_PATTERNS: NavigationPattern[] = [
  {
    patterns: [/saldo/i, /banco/i, /cuenta/i, /bcp/i, /interbank/i, /bbva/i],
    target: '/tesoreria/banking',
    title: 'Bancos y Tesorería',
  },
  {
    patterns: [/cobrar/i, /factura.*pendiente/i, /deuda/i, /cliente.*debe/i, /venta/i],
    target: '/facturacion/invoices',
    title: 'Cuentas por Cobrar',
    extractParams: (input) => {
      if (input.match(/pendiente/i)) return { filter: 'pending' };
      if (input.match(/vencida/i)) return { filter: 'overdue' };
      return undefined;
    },
  },
  {
    patterns: [/pagar/i, /gasto/i, /egreso/i, /factura.*recibida/i, /proveedor/i],
    target: '/tesoreria/bills',
    title: 'Cuentas por Pagar',
  },
  {
    patterns: [/cashflow/i, /flujo.*caja/i, /liquidez/i, /proyección/i],
    target: '/tesoreria/cashflow',
    title: 'Flujo de Caja',
  },
  {
    patterns: [/concilia/i, /matching/i, /diferencia.*banco/i],
    target: '/tesoreria/reconciliations',
    title: 'Conciliaciones',
  },
  {
    patterns: [/balance/i, /estado.*financiero/i, /resultado/i, /pyg/i, /pérdida.*ganancia/i],
    target: '/contabilidad/financials',
    title: 'Estados Financieros',
  },
  {
    patterns: [/activo/i, /equipo/i, /bien/i],
    target: '/contabilidad/assets',
    title: 'Activos',
  },
  {
    patterns: [/impuesto/i, /igv/i, /renta/i, /detracción/i, /percepción/i],
    target: '/cumplimiento/taxation',
    title: 'Impuestos',
  },
  {
    patterns: [/cumplimiento/i, /sunat/i, /obligación/i, /declaración/i],
    target: '/cumplimiento/compliance',
    title: 'Cumplimiento',
  },
  {
    patterns: [/audita/i, /revisión/i, /control/i, /trazabilidad/i],
    target: '/cumplimiento/audit',
    title: 'Auditoría',
  },
  {
    patterns: [/reporte/i, /kpi/i, /indicador/i, /gerencial/i, /métrica/i],
    target: '/contabilidad/reports',
    title: 'Reportes',
  },
  {
    patterns: [/cliente/i, /crm/i],
    target: '/operaciones/customers',
    title: 'Clientes',
  },
  {
    patterns: [/proveedor/i, /compra/i],
    target: '/operaciones/vendors',
    title: 'Proveedores',
  },
  {
    patterns: [/entidad/i, /ruc/i, /valida.*ruc/i],
    target: '/operaciones/entities',
    title: 'Entidades',
  },
  {
    patterns: [/inventario/i, /stock/i, /kardex/i, /almacén/i],
    target: '/operaciones/inventory',
    title: 'Inventarios',
  },
  {
    patterns: [/producto/i, /catálogo/i, /sku/i],
    target: '/operaciones/products',
    title: 'Productos',
  },
  {
    patterns: [/nómina/i, /planilla/i, /sueldo/i, /remuneración/i],
    target: '/operaciones/payroll',
    title: 'Nómina',
  },
  {
    patterns: [/documento/i, /archivo/i, /pdf/i, /xml/i],
    target: '/operaciones/documents',
    title: 'Documentos',
  },
  {
    patterns: [/dashboard/i, /panel/i, /resumen/i, /inicio/i],
    target: '/dashboard',
    title: 'Dashboard',
  },
  {
    patterns: [/inbox/i, /recepción/i, /documento.*recibido/i],
    target: '/operaciones/inbox',
    title: 'Recepción Digital',
  },
];
