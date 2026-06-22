/**
 * Validator Agent (Grok Code Fast 1 / OpenRouter)
 * Specialized in SUNAT 2026 compliance validation and XML generation
 *
 * Responsibilities:
 * - Validate invoice data against SUNAT 2026 regulations
 * - Check series format, tax codes, and fiscal rules
 * - Generate compliant UBL 2.1 XML
 * - Suggest fixes for violations
 */

import { randomUUID } from 'crypto';
import type { BaseAgent, ValidatorInput, ValidationResult, InvoiceData, ComplianceViolation } from '../types';
import type { GrokAdapter, OpenRouterAdapter } from '../adapters';
import { loggers } from '../../logger';

/**
 * ValidatorAgent class.
 *
 * @example
 * ```ts
 * const value = new ValidatorAgent();
 * console.log(value);
 * ```
 */
export class ValidatorAgent implements BaseAgent {
  id: string;
  role = 'validator' as const;
  status: 'idle' | 'processing' | 'completed' | 'error' = 'idle';

  private aiAdapter: GrokAdapter | OpenRouterAdapter;

  // SUNAT 2026 Compliance Rules
  private readonly SUNAT_RULES = {
    IGV_RATE: 0.18, // 18%
    IGV_TAX_CODE: '1000',
    INVOICE_TYPE_CODES: ['01', '03', '07', '08'],
    SERIES_PATTERNS: {
      '01': /^F\d{3}$/, // Facturas: F001-F999
      '03': /^B\d{3}$/, // Boletas: B001-B999
      '07': /^[FB]\d{3}$/, // Notas de Crédito
      '08': /^[FB]\d{3}$/, // Notas de Débito
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

  // System prompt for compliance validation
  private readonly SYSTEM_PROMPT = `Eres un auditor experto en cumplimiento normativo SUNAT 2026 para Perú.
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

  constructor(aiAdapter: GrokAdapter | OpenRouterAdapter) {
    this.id = `validator-${randomUUID()}`;
    this.aiAdapter = aiAdapter;
  }

  /**
   * Process invoice validation
   */
  async process(input: ValidatorInput): Promise<ValidationResult> {
    this.status = 'processing';
    const startTime = Date.now();

    try {
      loggers.ai.info('Validator agent processing', { invoiceType: input.invoiceType });

      // Pre-validation (fast checks)
      const preViolations = this.preValidate(input.proposedInvoice);

      // AI-powered validation
      const prompt = this.buildPrompt(input);
      
      // Both adapters support this signature (duck typing for messages)
      const messages = [
        { role: 'system' as const, content: this.SYSTEM_PROMPT },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.aiAdapter.complete(messages);

      // Parse response
      const parsed = this.parseResponse(response.content);

      // Combine violations
      const allViolations = [...preViolations, ...parsed.violations];

      const result: ValidationResult = {
        isCompliant: allViolations.length === 0,
        violations: allViolations,
        suggestedFixes: parsed.suggestedFixes || [],
        generatedXML: parsed.generatedXML,
        processingTime: Date.now() - startTime,
        agentId: this.id,
      };

      this.status = 'completed';
      loggers.ai.info('Validator agent completed', {
        processingTime: result.processingTime,
        compliant: result.isCompliant,
        violations: result.violations.length,
      });

      return result;
    } catch (error) {
      this.status = 'error';
      loggers.ai.error('Validator agent failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Pre-validation (fast, rule-based checks)
   */
  private preValidate(invoice: InvoiceData): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    // Validate RUC length
    if (invoice.issuerRuc?.length !== this.SUNAT_RULES.RUC_LENGTH) {
      violations.push({
        rule: 'RUC_FORMAT',
        description: `RUC emisor debe tener ${this.SUNAT_RULES.RUC_LENGTH} dígitos`,
        field: 'issuerRuc',
        severity: 'critical',
        sunatCode: '2801',
      });
    }

    if (invoice.customerRuc && invoice.customerDocType === '6') {
      if (invoice.customerRuc.length !== this.SUNAT_RULES.RUC_LENGTH) {
        violations.push({
          rule: 'RUC_FORMAT',
          description: `RUC cliente debe tener ${this.SUNAT_RULES.RUC_LENGTH} dígitos`,
          field: 'customerRuc',
          severity: 'critical',
          sunatCode: '2802',
        });
      }
    }

    // Validate series format
    const seriesPattern = this.SUNAT_RULES.SERIES_PATTERNS[invoice.invoiceType];
    if (seriesPattern && !seriesPattern.test(invoice.series)) {
      violations.push({
        rule: 'SERIES_FORMAT',
        description: `Serie inválida para tipo ${invoice.invoiceType}`,
        field: 'series',
        severity: 'critical',
        sunatCode: '2324',
      });
    }

    // Validate IGV calculation using integer math (cents) to avoid floating point errors
    const expectedIGVCents = Math.round(invoice.subtotal * 100 * this.SUNAT_RULES.IGV_RATE);
    const actualIGVCents = Math.round(invoice.igv * 100);
    const TOLERANCE_CENTS = 2; // 2 cents tolerance

    if (Math.abs(expectedIGVCents - actualIGVCents) > TOLERANCE_CENTS) {
      const expectedIGV = expectedIGVCents / 100;
      violations.push({
        rule: 'IGV_CALCULATION',
        description: `IGV incorrecto: debe ser 18% del subtotal (${expectedIGV.toFixed(2)})`,
        field: 'igv',
        severity: 'critical',
        sunatCode: '2810',
      });
    }

    // Validate total using integer math (cents)
    const expectedTotalCents = Math.round((invoice.subtotal + invoice.igv) * 100);
    const actualTotalCents = Math.round(invoice.total * 100);

    if (Math.abs(expectedTotalCents - actualTotalCents) > TOLERANCE_CENTS) {
      const expectedTotal = expectedTotalCents / 100;
      violations.push({
        rule: 'TOTAL_CALCULATION',
        description: `Total incorrecto: debe ser subtotal + IGV (${expectedTotal.toFixed(2)})`,
        field: 'total',
        severity: 'critical',
        sunatCode: '2811',
      });
    }

    // Validate currency
    if (!this.SUNAT_RULES.CURRENCIES.includes(invoice.currency)) {
      violations.push({
        rule: 'CURRENCY_CODE',
        description: `Moneda inválida: debe ser PEN o USD`,
        field: 'currency',
        severity: 'error',
        sunatCode: '2025',
      });
    }

    return violations;
  }

  /**
   * Build validation prompt
   */
  private buildPrompt(input: ValidatorInput): string {
    let prompt = `Valida el siguiente comprobante de pago según normativa SUNAT ${input.complianceYear}.\n\n`;
    prompt += `Tipo de comprobante: ${this.getInvoiceTypeName(input.invoiceType)}\n\n`;
    prompt += `Datos del comprobante:\n\
\
${JSON.stringify(input.proposedInvoice, null, 2)}
\
\
`;
    prompt += `IMPORTANTE: Si es válido, genera el XML UBL 2.1 completo y conforme.\n`;
    prompt += `Si hay violaciones, proporciona fixes específicos.`;

    return prompt;
  }

  /**
   * Get invoice type name
   */
  private getInvoiceTypeName(type: string): string {
    const types: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta de Venta',
      '07': 'Nota de Crédito',
      '08': 'Nota de Débito',
    };
    return types[type] || 'Desconocido';
  }

  /**
   * Parse AI response
   */
  private parseResponse(response: string): {
    isCompliant: boolean;
    violations: ComplianceViolation[];
    suggestedFixes: string[];
    generatedXML?: string;
  } {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      return JSON.parse(cleaned);
    } catch (error) {
      loggers.ai.error('Validator agent failed to parse response');
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent info
   */
  getInfo(): { id: string; role: string; status: string } {
    return {
      id: this.id,
      role: this.role,
      status: this.status,
    };
  }
}
