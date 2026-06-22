export type CountryCode = 'pe' | 'mx' | 'cl' | 'co';

export interface CountryAssistantQuickAction {
  label: string;
  command: string;
  emphasis: 'high' | 'medium';
}

export interface CountryPack {
  code: CountryCode;
  name: string;
  taxIdLabel: string;
  defaultCurrency: string;
  assistantPlaceholder: string;
  commandHint: string;
  assistantQuickActions: readonly CountryAssistantQuickAction[];
}

export const DEFAULT_COUNTRY_CODE: CountryCode = 'pe';

export const LATAM_COUNTRY_PACKS: Record<CountryCode, CountryPack> = {
  pe: {
    code: 'pe',
    name: 'Perú',
    taxIdLabel: 'RUC',
    defaultCurrency: 'PEN',
    assistantPlaceholder: 'Pide una mision: prepara SIRE, valida CPE, cruza XML vs ERP, concilia bancos...',
    commandHint: 'PE · Mision',
    assistantQuickActions: [
      {
        label: 'Preparar SIRE',
        command: 'Preparar SIRE RVIE y RCE del periodo actual con diff y evidencia por fila',
        emphasis: 'high',
      },
      {
        label: 'Validar CPE',
        command: 'Validar CPE, XML, CDR y reglas SUNAT 2026 para los comprobantes pendientes',
        emphasis: 'high',
      },
      {
        label: 'Revisar IGV',
        command: 'Revisar diferencias de IGV, detracciones y percepciones con propuesta de ajuste',
        emphasis: 'medium',
      },
      {
        label: 'Conciliar bancos',
        command: 'Conciliar bancos del mes actual y proponer asientos contables',
        emphasis: 'high',
      },
      {
        label: 'Emitir factura',
        command: 'Preparar factura electronica con validacion OSE y constancia SUNAT',
        emphasis: 'medium',
      },
      {
        label: 'Auditar cierre',
        command: 'Auditar cierre mensual peruano y priorizar bloqueos antes de aprobar',
        emphasis: 'medium',
      },
    ],
  },
  mx: {
    code: 'mx',
    name: 'México',
    taxIdLabel: 'RFC',
    defaultCurrency: 'MXN',
    assistantPlaceholder: 'Escribe una tarea: timbrar CFDI, validar SAT, revisar IVA...',
    commandHint: 'Comandos MX',
    assistantQuickActions: [
      { label: 'Timbrar CFDI', command: 'Preparar timbrado CFDI 4.0 del periodo actual', emphasis: 'high' },
      { label: 'Validar SAT', command: 'Validar claves SAT y uso CFDI', emphasis: 'medium' },
      { label: 'Revisar IVA', command: 'Revisar IVA trasladado y acreditable', emphasis: 'medium' },
      { label: 'Conciliar bancos', command: 'Conciliar bancos y cobros del mes actual', emphasis: 'high' },
    ],
  },
  cl: {
    code: 'cl',
    name: 'Chile',
    taxIdLabel: 'RUT',
    defaultCurrency: 'CLP',
    assistantPlaceholder: 'Escribe una tarea: emitir DTE, revisar folios, cuadrar IVA...',
    commandHint: 'Comandos CL',
    assistantQuickActions: [
      { label: 'Emitir DTE', command: 'Preparar emisión DTE del periodo actual', emphasis: 'high' },
      { label: 'Revisar folios', command: 'Revisar folios y pendientes SII', emphasis: 'medium' },
      { label: 'Cuadrar IVA', command: 'Cuadrar IVA compras y ventas', emphasis: 'medium' },
      { label: 'Conciliar bancos', command: 'Conciliar bancos y pagos del mes actual', emphasis: 'high' },
    ],
  },
  co: {
    code: 'co',
    name: 'Colombia',
    taxIdLabel: 'NIT',
    defaultCurrency: 'COP',
    assistantPlaceholder: 'Escribe una tarea: validar DIAN, revisar soporte, conciliar...',
    commandHint: 'Comandos CO',
    assistantQuickActions: [
      { label: 'Validar DIAN', command: 'Validar facturación electrónica DIAN del periodo actual', emphasis: 'high' },
      { label: 'Documento soporte', command: 'Revisar documentos soporte pendientes', emphasis: 'medium' },
      { label: 'Revisar IVA', command: 'Revisar IVA generado y descontable', emphasis: 'medium' },
      { label: 'Conciliar bancos', command: 'Conciliar bancos y recaudos del mes actual', emphasis: 'high' },
    ],
  },
};

export function resolveCountryCode(value: unknown): CountryCode {
  if (typeof value !== 'string') return DEFAULT_COUNTRY_CODE;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pe' || normalized === 'mx' || normalized === 'cl' || normalized === 'co') {
    return normalized;
  }
  return DEFAULT_COUNTRY_CODE;
}

export function getCountryPack(code?: CountryCode | string | null): CountryPack {
  const normalized = resolveCountryCode(code);
  return LATAM_COUNTRY_PACKS[normalized];
}
