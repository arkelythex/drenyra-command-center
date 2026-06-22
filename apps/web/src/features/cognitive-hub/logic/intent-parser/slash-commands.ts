import type { SlashCommandConfig } from './types';

export const SLASH_COMMANDS: Record<string, SlashCommandConfig> = {
  '/bancos': {
    path: '/tesoreria/banking',
    title: 'Bancos y Tesorería',
    description: 'Ver cuentas y saldos',
  },
  '/saldo': {
    path: '/tesoreria/banking',
    title: 'Saldos Bancarios',
    description: 'Consultar saldos',
  },
  '/cashflow': {
    path: '/tesoreria/cashflow',
    title: 'Flujo de Caja',
    description: 'Proyecciones de liquidez',
  },
  '/cobrar': {
    path: '/facturacion/invoices',
    title: 'Cuentas por Cobrar',
    description: 'Facturas pendientes',
  },
  '/pagar': {
    path: '/tesoreria/bills',
    title: 'Cuentas por Pagar',
    description: 'Facturas por pagar',
  },
  '/conciliar': {
    path: '/tesoreria/reconciliations',
    title: 'Conciliaciones',
    description: 'Matching bancario',
  },
  '/balance': {
    path: '/contabilidad/financials',
    title: 'Estados Financieros',
    description: 'Balance y resultados',
  },
  '/activos': {
    path: '/contabilidad/assets',
    title: 'Activos',
    description: 'Gestión de activos',
  },
  '/impuestos': {
    path: '/cumplimiento/taxation',
    title: 'Impuestos',
    description: 'Obligaciones tributarias',
  },
  '/igv': {
    path: '/cumplimiento/taxation',
    title: 'IGV',
    description: 'Liquidación de IGV',
  },
  '/sunat': {
    path: '/cumplimiento/compliance',
    title: 'Cumplimiento SUNAT',
    description: 'Verificación normativa',
  },
  '/cumplimiento': {
    path: '/cumplimiento/compliance',
    title: 'Cumplimiento 360',
    description: 'Monitoreo fiscal',
  },
  '/auditar': {
    path: '/cumplimiento/audit',
    title: 'Auditoría',
    description: 'Control y trazabilidad',
  },
  '/reporte': {
    path: '/contabilidad/reports',
    title: 'Reportes',
    description: 'Reportes gerenciales',
  },
  '/clientes': {
    path: '/operaciones/customers',
    title: 'Clientes',
    description: 'Gestión comercial',
  },
  '/proveedores': {
    path: '/operaciones/vendors',
    title: 'Proveedores',
    description: 'Gestión de compras',
  },
  '/entidades': {
    path: '/operaciones/entities',
    title: 'Entidades',
    description: 'Directorio RUC',
  },
  '/inventario': {
    path: '/operaciones/inventory',
    title: 'Inventarios',
    description: 'Control de stock',
  },
  '/productos': {
    path: '/operaciones/products',
    title: 'Productos',
    description: 'Catálogo',
  },
  '/nomina': {
    path: '/operaciones/payroll',
    title: 'Nómina',
    description: 'Liquidación de planillas',
  },
  '/documentos': {
    path: '/operaciones/documents',
    title: 'Documentos',
    description: 'Archivo tributario',
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Panel principal',
  },
  '/inbox': {
    path: '/operaciones/inbox',
    title: 'Recepción Digital',
    description: 'Documentos recibidos',
  },

  // ─── Drenyra Composer actions ───────────────────────────────────────────
  '/detalle': {
    path: '/dashboard',
    title: 'Vista Detalle',
    description: 'Ver información detallada',
  },
  '/resumen': {
    path: '/dashboard',
    title: 'Resumen General',
    description: 'Panel de resumen ejecutivo',
  },
  '/agente': {
    path: '/drenyra',
    title: 'Correr Agente',
    description: 'Ejecutar agente fiscal',
  },
} as const;
