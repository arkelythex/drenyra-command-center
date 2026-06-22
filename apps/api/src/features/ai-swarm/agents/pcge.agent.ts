/**
 * PCGE Agent - Accounting Classification
 *
 * Classifies transactions into PCGE (Plan Contable General Empresarial)
 * accounts using AI reasoning + historical patterns.
 *
 * Uses Gemini Flash Thinking for cost-effective reasoning.
 *
 * @module ai-swarm/agents
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import {
  hasOpenRouterKey,
  openrouter,
  getModelForAgent,
  estimateCost,
} from '../config/openrouter.config';
import { agentCache } from '../tools/cache';
import { budgetTracker } from '../tools/budget-tracker';
import type { InvoiceData, PCGEClassification, AgentResult } from '../config/types';

/**
 * PCGE classification schema
 */
const PCGEClassificationSchema = z.object({
  asientos: z.array(
    z.object({
      cuenta: z.string().describe('Código de cuenta PCGE (ej: 60111)'),
      descripcion: z.string().describe('Descripción de la cuenta'),
      debe: z.number().describe('Monto en el debe'),
      haber: z.number().describe('Monto en el haber'),
      confidence: z.number().min(0).max(1).describe('Confianza en la clasificación'),
      evidence: z.string().optional().describe('Justificación de la clasificación'),
    })
  ),
  glosa: z.string().describe('Glosa del asiento contable'),
});

/**
 * PCGE Agent
 *
 * Classifies invoices into accounting entries
 * @example
 * ```ts
 * const value = new PCGEAgent();
 * console.log(value);
 * ```
 */

export class PCGEAgent {
  /**
   * Classify invoice into PCGE accounts
   *
   * @param invoice - Invoice data to classify
   * @returns Accounting classification
   */
  async classifyInvoice(
    invoice: InvoiceData
  ): Promise<AgentResult<PCGEClassification[]>> {
    const startTime = Date.now();

    const cacheInput = {
      ruc: invoice.ruc,
      serie: invoice.serie,
      numero: invoice.numero,
      fecha: invoice.fecha,
      moneda: invoice.moneda,
      subtotal: invoice.subtotal,
      igv: invoice.igv,
      total: invoice.total,
      items: invoice.items,
    };

    const cached = agentCache.get<PCGEClassification[]>('pcge', cacheInput);
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          agentType: 'pcge',
          modelUsed: 'cache',
          tokensUsed: 0,
          costUsd: 0,
          durationMs: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }

    if (!hasOpenRouterKey()) {
      return {
        success: false,
        error: {
          code: 'PCGE_NO_API_KEY',
          message: 'OPENROUTER_API_KEY not configured. PCGE agent requires API key.',
        },
        metadata: {
          agentType: 'pcge',
          modelUsed: 'none',
          tokensUsed: 0,
          costUsd: 0,
          durationMs: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }

    try {
      const modelId = getModelForAgent('pcge');
      const model = openrouter(modelId);

      const prompt = `
Eres un contador experto en PCGE (Plan Contable General Empresarial) de Perú.

Clasifica la siguiente factura de COMPRA en asientos contables según PCGE:

RUC Proveedor: ${invoice.ruc}
Fecha: ${invoice.fecha}
Serie-Número: ${invoice.serie}-${invoice.numero}
Moneda: ${invoice.moneda}

Items:
${invoice.items.map((item, i) => `${i + 1}. ${item.descripcion} - Cantidad: ${item.cantidad} - Precio: ${item.precioUnitario} - Subtotal: ${item.subtotal}`).join('\n')}

Subtotal: ${invoice.subtotal}
IGV (18%): ${invoice.igv}
Total: ${invoice.total}

REGLAS PCGE:
- Cuenta 60: Compras
- Cuenta 40111: IGV Crédito Fiscal
- Cuenta 42: Proveedores

Para CADA item, identifica:
1. Subcuenta específica de la cuenta 60 (Ej: 60111 para mercaderías, 60321 para suministros)
2. Justifica tu clasificación
3. Asigna un nivel de confianza (0-1)

El asiento debe estar balanceado: DEBE = HABER

Devuelve SOLO JSON válido, sin texto adicional.
`;

      const result = await generateObject({
        model,
        schema: PCGEClassificationSchema,
        prompt,
        temperature: 0.2,
      });

      // Convert to PCGEClassification array
      const classifications: PCGEClassification[] = result.object.asientos.map(
        (asiento) => ({
          cuenta: asiento.cuenta,
          descripcion: asiento.descripcion,
          debe: asiento.debe,
          haber: asiento.haber,
          confidence: asiento.confidence,
          evidence: asiento.evidence,
        })
      );

      const durationMs = Date.now() - startTime;
      const tokensUsed = result.usage.totalTokens ?? 0;
      const costUsd = estimateCost('pcge', tokensUsed);

      agentCache.set('pcge', cacheInput, classifications, costUsd);

      if (costUsd > 0 || tokensUsed > 0) {
        budgetTracker.record({
          agentType: 'pcge',
          modelUsed: modelId,
          tokensUsed,
          costUsd,
        });
      }

      return {
        success: true,
        data: classifications,
        metadata: {
          agentType: 'pcge',
          modelUsed: modelId,
          tokensUsed,
          costUsd,
          durationMs,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        success: false,
        error: {
          code: 'PCGE_CLASSIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metadata: {
          agentType: 'pcge',
          modelUsed: getModelForAgent('pcge'),
          tokensUsed: 0,
          costUsd: 0,
          durationMs,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Classify multiple invoices in parallel
   *
   * @param invoices - Array of invoices to classify
   * @returns Array of classification results
   */
  async classifyBatch(
    invoices: InvoiceData[]
  ): Promise<Array<AgentResult<PCGEClassification[]>>> {
    return Promise.all(invoices.map((invoice) => this.classifyInvoice(invoice)));
  }

  /**
   * Validate classification balance
   *
   * Ensures DEBE = HABER for accounting balance
   */
  validateBalance(classifications: PCGEClassification[]): {
    isBalanced: boolean;
    debe: number;
    haber: number;
    difference: number;
  } {
    const debe = classifications.reduce((sum, c) => sum + c.debe, 0);
    const haber = classifications.reduce((sum, c) => sum + c.haber, 0);
    const difference = Math.abs(debe - haber);

    return {
      isBalanced: difference < 0.01, // Allow 1 cent tolerance for rounding
      debe,
      haber,
      difference,
    };
  }
}
