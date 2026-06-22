/**
 * Reconciliation Agent - Bank Statement Matching
 *
 * Matches bank transactions with invoices/bills using AI reasoning.
 * Handles complex scenarios like partial payments, multiple invoices, etc.
 *
 * Uses GPT-4 Turbo for intelligent matching.
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
import { budgetTracker } from '../tools/budget-tracker';
import type { AgentResult } from '../config/types';

/**
 * Bank transaction
 * @example
 * ```ts
 * const value: BankTransaction = {} as BankTransaction;
 * console.log(value);
 * ```
 */

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
}

/**
 * Invoice/Bill for matching
 * @example
 * ```ts
 * const value: Document = {} as Document;
 * console.log(value);
 * ```
 */

export interface Document {
  id: string;
  ruc: string;
  serie: string;
  numero: string;
  date: string;
  total: number;
  type: 'invoice' | 'bill';
}

/**
 * Match result
 * @example
 * ```ts
 * const value: Match = {} as Match;
 * console.log(value);
 * ```
 */

export interface Match {
  transactionId: string;
  documentId: string;
  confidence: number;
  matchType: 'exact' | 'partial' | 'multiple' | 'manual';
  amountMatched: number;
  difference: number;
  evidence: string;
}

/**
 * Reconciliation schema
 */
const ReconciliationSchema = z.object({
  matches: z.array(
    z.object({
      transactionId: z.string(),
      documentId: z.string(),
      confidence: z.number().min(0).max(1),
      matchType: z.enum(['exact', 'partial', 'multiple', 'manual']),
      amountMatched: z.number(),
      difference: z.number(),
      evidence: z.string(),
    })
  ),
  unmatched: z.object({
    transactions: z.array(z.string()),
    documents: z.array(z.string()),
  }),
});

/**
 * Reconciliation Agent
 *
 * Intelligently matches bank transactions with invoices/bills
 * @example
 * ```ts
 * const value = new ReconciliationAgent();
 * console.log(value);
 * ```
 */

export class ReconciliationAgent {
  /**
   * Reconcile bank transactions with documents
   *
   * @param transactions - Bank transactions
   * @param documents - Invoices/bills to match
   * @returns Matching results
   */
  async reconcile(
    transactions: BankTransaction[],
    documents: Document[]
  ): Promise<AgentResult<{ matches: Match[]; unmatched: { transactions: string[]; documents: string[] } }>> {
    const startTime = Date.now();

    if (!hasOpenRouterKey()) {
      return {
        success: false,
        error: {
          code: 'RECONCILIATION_NO_API_KEY',
          message: 'OPENROUTER_API_KEY not configured. Reconciliation agent requires API key.',
        },
        metadata: {
          agentType: 'reconciliation',
          modelUsed: 'none',
          tokensUsed: 0,
          costUsd: 0,
          durationMs: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }

    try {
      const modelId = getModelForAgent('reconciliation');
      const model = openrouter(modelId);

      const prompt = `
Eres un experto en reconciliación bancaria para contabilidad peruana.

Tienes que hacer matching entre transacciones bancarias y documentos contables (facturas y recibos).

TRANSACCIONES BANCARIAS:
${transactions.map((t, i) => `${i + 1}. ID: ${t.id}
   Fecha: ${t.date}
   Descripción: ${t.description}
   Monto: ${t.type === 'debit' ? '-' : '+'}${t.amount}
   Referencia: ${t.reference || 'N/A'}`).join('\n\n')}

DOCUMENTOS CONTABLES:
${documents.map((d, i) => `${i + 1}. ID: ${d.id}
   Tipo: ${d.type}
   RUC: ${d.ruc}
   Serie-Número: ${d.serie}-${d.numero}
   Fecha: ${d.date}
   Total: ${d.total}`).join('\n\n')}

REGLAS DE MATCHING:
1. **Exact match**: Mismo monto, fechas cercanas (±3 días)
2. **Partial match**: Monto parcial del documento (pagos a cuenta)
3. **Multiple match**: Una transacción cubre múltiples documentos
4. **Manual match**: Casos complejos que requieren revisión humana

Para cada match:
- Calcula la confianza (0-1)
- Identifica el tipo de match
- Calcula la diferencia (si existe)
- Justifica el match con evidencia

Devuelve:
- **matches**: Array de matches encontrados
- **unmatched**: Transacciones y documentos sin match

Devuelve SOLO JSON válido, sin texto adicional.
`;

      const result = await generateObject({
        model,
        schema: ReconciliationSchema,
        prompt,
        temperature: 0.2,
      });

      const durationMs = Date.now() - startTime;
      const tokensUsed = result.usage.totalTokens ?? 0;
      const costUsd = estimateCost('reconciliation', tokensUsed);

      if (costUsd > 0 || tokensUsed > 0) {
        budgetTracker.record({
          agentType: 'reconciliation',
          modelUsed: modelId,
          tokensUsed,
          costUsd,
        });
      }

      return {
        success: true,
        data: {
          matches: result.object.matches,
          unmatched: result.object.unmatched,
        },
        metadata: {
          agentType: 'reconciliation',
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
          code: 'RECONCILIATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metadata: {
          agentType: 'reconciliation',
          modelUsed: getModelForAgent('reconciliation'),
          tokensUsed: 0,
          costUsd: 0,
          durationMs,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Reconcile for multiple RUCs in parallel
   *
   * @param reconciliations - Array of reconciliation tasks per RUC
   * @returns Array of reconciliation results
   */
  async reconcileBatch(
    reconciliations: Array<{
      ruc: string;
      transactions: BankTransaction[];
      documents: Document[];
    }>
  ): Promise<
    Array<
      AgentResult<{
        matches: Match[];
        unmatched: { transactions: string[]; documents: string[] };
      }> & { ruc: string }
    >
  > {
    const results = await Promise.all(
      reconciliations.map(async (recon) => {
        const result = await this.reconcile(recon.transactions, recon.documents);
        return {
          ...result,
          ruc: recon.ruc,
        };
      })
    );

    return results;
  }

  /**
   * Calculate reconciliation statistics
   */
  calculateStats(result: {
    matches: Match[];
    unmatched: { transactions: string[]; documents: string[] };
  }): {
    totalMatches: number;
    exactMatches: number;
    partialMatches: number;
    averageConfidence: number;
    totalUnmatched: number;
    matchRate: number;
  } {
    const totalMatches = result.matches.length;
    const exactMatches = result.matches.filter((m) => m.matchType === 'exact').length;
    const partialMatches = result.matches.filter((m) => m.matchType === 'partial').length;
    const averageConfidence =
      result.matches.reduce((sum, m) => sum + m.confidence, 0) / (totalMatches || 1);
    const totalUnmatched =
      result.unmatched.transactions.length + result.unmatched.documents.length;
    const matchRate = totalMatches / (totalMatches + totalUnmatched);

    return {
      totalMatches,
      exactMatches,
      partialMatches,
      averageConfidence,
      totalUnmatched,
      matchRate,
    };
  }
}
