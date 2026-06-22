export type CountryCode = 'pe' | 'mx' | 'cl' | 'co';

export interface CountryPack {
  code: CountryCode;
  name: string;
  taxIdLabel: string;
  defaultCurrency: string;
  assistantPlaceholder: string;
  commandHint: string;
  assistantQuickActions: ReadonlyArray<{
    label: string;
    command: string;
    emphasis: 'high' | 'medium';
  }>;
}

export const DEFAULT_COUNTRY_CODE: CountryCode = 'pe';

export const LATAM_COUNTRY_PACKS: Record<CountryCode, CountryPack> = {
  pe: {
    code: 'pe',
    name: 'Peru',
    taxIdLabel: 'RUC',
    defaultCurrency: 'PEN',
    assistantPlaceholder:
      'Ejemplo: concilia bancos, valida CPE o prepara el SIRE del periodo.',
    commandHint: 'Comandos PE /',
    assistantQuickActions: [
      {
        label: 'Preparar SIRE',
        command: 'Preparar SIRE del periodo actual',
        emphasis: 'high',
      },
      {
        label: 'Validar CPE',
        command: 'Validar CPE y reglas SUNAT 2026',
        emphasis: 'medium',
      },
      {
        label: 'Revisar IGV',
        command: 'Revisar diferencias de IGV y detracciones',
        emphasis: 'medium',
      },
      {
        label: 'Conciliar bancos',
        command: 'Conciliar bancos del mes actual',
        emphasis: 'high',
      },
    ],
  },
  mx: {
    code: 'mx',
    name: 'Mexico',
    taxIdLabel: 'RFC',
    defaultCurrency: 'MXN',
    assistantPlaceholder:
      'Ejemplo: timbra CFDI, valida claves SAT o revisa IVA del periodo.',
    commandHint: 'Comandos MX /',
    assistantQuickActions: [
      {
        label: 'Timbrar CFDI',
        command: 'Preparar timbrado CFDI 4.0 del periodo actual',
        emphasis: 'high',
      },
      {
        label: 'Validar SAT',
        command: 'Validar claves SAT y uso CFDI',
        emphasis: 'medium',
      },
      {
        label: 'Revisar IVA',
        command: 'Revisar IVA trasladado y acreditable',
        emphasis: 'medium',
      },
      {
        label: 'Conciliar bancos',
        command: 'Conciliar bancos y cobros del mes actual',
        emphasis: 'high',
      },
    ],
  },
  cl: {
    code: 'cl',
    name: 'Chile',
    taxIdLabel: 'RUT',
    defaultCurrency: 'CLP',
    assistantPlaceholder:
      'Ejemplo: emite DTE, revisa folios o cuadra el IVA de compras y ventas.',
    commandHint: 'Comandos CL /',
    assistantQuickActions: [
      {
        label: 'Emitir DTE',
        command: 'Preparar emision DTE del periodo actual',
        emphasis: 'high',
      },
      {
        label: 'Revisar folios',
        command: 'Revisar folios y pendientes SII',
        emphasis: 'medium',
      },
      {
        label: 'Cuadrar IVA',
        command: 'Cuadrar IVA compras y ventas',
        emphasis: 'medium',
      },
      {
        label: 'Conciliar bancos',
        command: 'Conciliar bancos y pagos del mes actual',
        emphasis: 'high',
      },
    ],
  },
  co: {
    code: 'co',
    name: 'Colombia',
    taxIdLabel: 'NIT',
    defaultCurrency: 'COP',
    assistantPlaceholder:
      'Ejemplo: valida DIAN, prepara documento soporte o revisa IVA del corte.',
    commandHint: 'Comandos CO /',
    assistantQuickActions: [
      {
        label: 'Validar DIAN',
        command: 'Validar facturacion electronica DIAN del periodo actual',
        emphasis: 'high',
      },
      {
        label: 'Documento soporte',
        command: 'Revisar documentos soporte pendientes',
        emphasis: 'medium',
      },
      {
        label: 'Revisar IVA',
        command: 'Revisar IVA generado y descontable',
        emphasis: 'medium',
      },
      {
        label: 'Conciliar bancos',
        command: 'Conciliar bancos y recaudos del mes actual',
        emphasis: 'high',
      },
    ],
  },
};

export function isCountryCode(value: string): value is CountryCode {
  return value in LATAM_COUNTRY_PACKS;
}

export function getCountryPack(code?: string | null): CountryPack {
  if (code && isCountryCode(code)) {
    return LATAM_COUNTRY_PACKS[code];
  }

  return LATAM_COUNTRY_PACKS[DEFAULT_COUNTRY_CODE];
}
