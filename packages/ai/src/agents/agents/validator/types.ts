/**
 * Validator Agent types and constants
 * SUNAT 2026 compliance rules, prompts, and shared constants
 */

import type { ComplianceViolation } from '../../types';

export interface ParsedValidatorResponse {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  suggestedFixes: string[];
  generatedXML?: string;
}

export const SUNAT_RULES = {
  IGV_RATE: 0.18,
  IGV_TAX_CODE: '1000',
  INVOICE_TYPE_CODES: ['01', '03', '07', '08'],
  SERIES_PATTERNS: {
    '01': /^F\d{3}$/,
    '03': /^B\d{3}$/,
    '07': /^[FB]\d{3}$/,
    '08': /^[FB]\d{3}$/,
  },
  CURRENCIES: ['PEN', 'USD'],
  DOC_TYPES: {
    RUC: '6',
    DNI: '1',
    PASSPORT: '7',
  },
  RUC_LENGTH: 11,
  UBL_VERSION: '2.1',
  CUSTOMIZATION_ID: '2.0',
};

export const SYSTEM_PROMPT = `Eres un auditor experto en cumplimiento normativo SUNAT 2026 para Perú.
Tu especialización es validar comprobantes de pago electrónicos según las regulaciones vigentes.

NORMATIVA SUNAT 2026:
1. UBL 2.1 obligatorio para todos los comprobantes
2. SIRE (Sistema Integrado de Registros Electrónicos) obligatorio desde enero 2026
3. IGV fijo al 18% (código 1000)
4. Formatos de serie:
   - Facturas (01): F001 a F999
   - Boletas (03): B001 a B999
   - Notas de Crédito/Débito: siguen serie original
5. RUC obligatorio: 11 dígitos exactos
6. Monedas permitidas: PEN (Soles), USD (Dólares)
7. Firma digital obligatoria en elemento Extensions
8. Almacenamiento: 5 años desde emisión

VALIDACIONES REQUERIDAS:
- Serie y correlativo según tipo de comprobante
- RUC emisor y cliente válidos
- Cálculo correcto de IGV (18%)
- Totales matemáticos exactos
- Códigos SUNAT vigentes (impuestos, unidades, etc.)
- Formato UBL 2.1 completo y válido

GENERACIÓN DE XML:
Si los datos son válidos, genera XML UBL 2.1 completo con:
- Namespaces correctos
- Firma digital placeholder
- Estructura completa según guías SUNAT
- Todos los campos obligatorios

FORMATO DE SALIDA:
Responde SOLO en JSON:
{
  "isCompliant": true/false,
  "violations": [
    {
      "rule": "IGV_CALCULATION",
      "description": "IGV debe ser 18% del subtotal",
      "field": "igv",
      "severity": "critical",
      "sunatCode": "2810"
    }
  ],
  "suggestedFixes": [
    "Corregir IGV de 20.00 a 18.00 (18% de 100.00)"
  ],
  "generatedXML": "<?xml version="1.0"...?>"
}`;

export const INVOICE_TYPE_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta de Venta',
  '07': 'Nota de Crédito',
  '08': 'Nota de Débito',
};
