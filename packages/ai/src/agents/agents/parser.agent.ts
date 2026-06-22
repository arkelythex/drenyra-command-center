/**
 * Parser Agent (Gemini Flash - Instance B)
 * Specialized in XML UBL 2.0/2.1 parsing and validation
 *
 * Responsibilities:
 * - Parse existing XML invoices (legacy and modern)
 * - Validate against UBL schema
 * - Cross-reference with Reader Agent data
 * - Detect discrepancies and migration needs
 */

import { randomUUID } from 'crypto';
import type { BaseAgent, ParserInput, ParsedData, InvoiceData, Discrepancy, ExtractedData } from '../types';
import { GeminiMultiAdapter } from '../adapters';
import { loggers } from '../../logger';

/**
 * ParserAgent class.
 *
 * @example
 * ```ts
 * const value = new ParserAgent();
 * console.log(value);
 * ```
 */
export class ParserAgent implements BaseAgent {
  id: string;
  role = 'parser' as const;
  status: 'idle' | 'processing' | 'completed' | 'error' = 'idle';

  private gemini: GeminiMultiAdapter;

  // System prompt optimized for XML parsing
  private readonly SYSTEM_PROMPT = `Eres un experto en XML UBL 2.0 y 2.1 para facturación electrónica SUNAT Perú.
Tu tarea es parsear y validar archivos XML de comprobantes de pago electrónicos.

CONOCIMIENTO TÉCNICO REQUERIDO:
1. UBL 2.0 vs UBL 2.1: Diferencias en namespaces y estructura
2. Elementos obligatorios SUNAT:
   - cbc:UBLVersionID: "2.1" o "2.0"
   - cbc:CustomizationID: "2.0" para UBL 2.1
   - cbc:ID: Número de comprobante (F001-00000123)
   - cac:Signature: Firma digital (obligatoria)
   - cac:AccountingSupplierParty: Datos del emisor
   - cac:AccountingCustomerParty: Datos del cliente
   - cac:TaxTotal: Totales de impuestos (IGV)
   - cac:LegalMonetaryTotal: Importes totales

3. Validaciones críticas:
   - RUC emisor en cbc:CompanyID (11 dígitos)
   - RUC cliente en cbc:ID con schemeID="6"
   - IGV con cbc:ID="1000" y Percent="18.00"
   - Currency code válido (PEN, USD)
   - Totales matemáticos correctos

4. Detección de discrepancias:
   - Comparar con datos del Reader Agent (si provisto)
   - Marcar diferencias en montos, RUCs, fechas
   - Clasificar severidad (low, medium, high, critical)

FORMATO DE SALIDA:
Responde SOLO en JSON válido:
{
  "parsedData": {
    "issuerRuc": "20123456789",
    "issuerName": "EMPRESA SAC",
    ... (misma estructura que InvoiceData)
  },
  "schemaVersion": "UBL_2.1",
  "discrepancies": [
    {
      "field": "total",
      "expectedValue": 118.00,
      "actualValue": 119.00,
      "severity": "high",
      "message": "Total no coincide con Reader Agent"
    }
  ],
  "needsMigration": false
}`;

  constructor(gemini: GeminiMultiAdapter) {
    this.id = `parser-${randomUUID()}`;
    this.gemini = gemini;
  }

  /**
   * Process XML invoice
   */
  async process(input: ParserInput): Promise<ParsedData> {
    this.status = 'processing';
    const startTime = Date.now();

    try {
      loggers.ai.info('Parser agent processing XML', {
        schema: input.schema ?? input.schemaVersion ?? 'UBL_2.1',
      });

      const prompt = this.buildPrompt(input);

      const response = await this.gemini.generate({
        text: prompt,
        systemInstruction: this.SYSTEM_PROMPT,
      });

      // Parse JSON response
      const parsed = this.parseResponse(response.content);

      // Additional validation
      const additionalDiscrepancies = this.validateXMLData(parsed.parsedData, input.readerData);

      const result: ParsedData = {
        parsedData: parsed.parsedData,
        schemaVersion: parsed.schemaVersion || input.schemaVersion || input.schema || 'UBL_2.1',
        discrepancies: [...parsed.discrepancies, ...additionalDiscrepancies],
        needsMigration: parsed.needsMigration || this.checkMigrationNeed(parsed.schemaVersion),
        processingTime: Date.now() - startTime,
        agentId: this.id,
      };

      this.status = 'completed';
      loggers.ai.info('Parser agent completed', {
        processingTime: result.processingTime,
        discrepancies: result.discrepancies.length,
      });

      return result;
    } catch (error) {
      this.status = 'error';
      loggers.ai.error('Parser agent failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Build parsing prompt
   */
  private buildPrompt(input: ParserInput): string {
    let prompt = `Parsea el siguiente XML de comprobante de pago SUNAT y extrae todos los campos estructurados.\n\n`;
    prompt += `Esquema esperado: ${input.schema}\n\n`;
    prompt += `XML:\n\`\`\`xml\n${input.xmlContent}\n\`\`\`\n\n`;

    if (input.readerData) {
      prompt += `IMPORTANTE: El Reader Agent ya extrajo datos de la imagen del mismo comprobante.\n`;
      prompt += `Compara los datos del XML con estos datos de referencia y marca cualquier discrepancia:\n\n`;
      prompt += `\`\`\`json\n${JSON.stringify(input.readerData.extractedData, null, 2)}\n\`\`\`\n\n`;
      prompt += `Presta especial atención a:\n`;
      prompt += `- Montos (subtotal, IGV, total)\n`;
      prompt += `- RUCs (emisor y cliente)\n`;
      prompt += `- Número de comprobante\n`;
      prompt += `- Fecha de emisión\n`;
    }

    return prompt;
  }

  /**
   * Parse AI response to structured data
   */
  private parseResponse(response: string): {
    parsedData: InvoiceData;
    schemaVersion: string;
    discrepancies: Discrepancy[];
    needsMigration: boolean;
  } {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Convert issueDate string to Date object
      if (parsed.parsedData?.issueDate) {
        parsed.parsedData.issueDate = new Date(parsed.parsedData.issueDate);
      }
      if (parsed.parsedData?.dueDate) {
        parsed.parsedData.dueDate = new Date(parsed.parsedData.dueDate);
      }

      return parsed;
    } catch (error) {
      loggers.ai.error('Parser agent failed to parse response');
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate XML data against Reader data
   */
  private validateXMLData(xmlData: InvoiceData, readerData?: ExtractedData): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    if (!readerData) return discrepancies;

    const reader = readerData.extractedData;

    // Compare critical fields
    const criticalFields: Array<{ field: keyof InvoiceData; label: string }> = [
      { field: 'total', label: 'Total' },
      { field: 'subtotal', label: 'Subtotal' },
      { field: 'igv', label: 'IGV' },
      { field: 'issuerRuc', label: 'RUC Emisor' },
      { field: 'customerRuc', label: 'RUC Cliente' },
    ];

    for (const { field, label } of criticalFields) {
      const xmlValue = xmlData[field];
      const readerValue = reader[field];

      if (xmlValue !== readerValue) {
        // For numbers, allow small tolerance
        if (typeof xmlValue === 'number' && typeof readerValue === 'number') {
          const diff = Math.abs(xmlValue - readerValue);
          if (diff < 0.05) continue; // Tolerance of 5 cents
        }

        discrepancies.push({
          field,
          expectedValue: readerValue,
          actualValue: xmlValue,
          severity: this.getSeverity(field),
          message: `${label} difiere: Reader=${readerValue}, XML=${xmlValue}`,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Get severity for field discrepancy
   */
  private getSeverity(field: keyof InvoiceData): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFields: Array<keyof InvoiceData> = ['total', 'issuerRuc', 'customerRuc'];
    const highFields: Array<keyof InvoiceData> = ['subtotal', 'igv', 'invoiceNumber'];
    const mediumFields: Array<keyof InvoiceData> = ['issueDate', 'series', 'correlative'];

    if (criticalFields.includes(field)) return 'critical';
    if (highFields.includes(field)) return 'high';
    if (mediumFields.includes(field)) return 'medium';
    return 'low';
  }

  /**
   * Check if XML needs migration
   */
  private checkMigrationNeed(schemaVersion: string): boolean {
    return schemaVersion === 'UBL_2.0';
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
