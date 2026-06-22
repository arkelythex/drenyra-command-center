import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadReconciliationAgent(options: {
  generateObjectImpl: ReturnType<typeof vi.fn>;
  estimateCost?: number;
}) {
  vi.resetModules();

  vi.doMock('ai', () => ({
    generateObject: options.generateObjectImpl,
  }));

  vi.doMock('../../config/openrouter.config', async () => {
    const actual = await vi.importActual<typeof import('../../config/openrouter.config')>(
      '../../config/openrouter.config',
    );

    return {
      ...actual,
      hasOpenRouterKey: () => true,
      openrouter: vi.fn(() => ({ provider: 'mock' })),
      getModelForAgent: vi.fn(() => 'mock/reconciliation-model'),
      estimateCost: vi.fn(() => options.estimateCost ?? 0.01),
    };
  });

  return import('../../agents/reconciliation.agent');
}

describe('ReconciliationAgent AI path', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('ai');
    vi.doUnmock('../../config/openrouter.config');
  });

  it('reconciles transactions and returns model metadata', async () => {
    const generateObject = vi.fn(async () => ({
      object: {
        matches: [
          {
            transactionId: 'TX-1',
            documentId: 'DOC-1',
            confidence: 0.9,
            matchType: 'exact',
            amountMatched: 118,
            difference: 0,
            evidence: 'monto exacto',
          },
        ],
        unmatched: {
          transactions: [],
          documents: [],
        },
      },
      usage: { totalTokens: 220 },
    }));

    const { ReconciliationAgent } = await loadReconciliationAgent({
      generateObjectImpl: generateObject,
      estimateCost: 0.02,
    });

    const agent = new ReconciliationAgent();
    const result = await agent.reconcile(
      [
        {
          id: 'TX-1',
          date: '2026-02-18',
          description: 'Pago factura F001-1',
          amount: 118,
          type: 'debit',
        },
      ],
      [
        {
          id: 'DOC-1',
          ruc: '20100070970',
          serie: 'F001',
          numero: '00000001',
          date: '2026-02-18',
          total: 118,
          type: 'invoice',
        },
      ],
    );

    expect(result.success).toBe(true);
    expect(result.data?.matches).toHaveLength(1);
    expect(result.metadata.modelUsed).toBe('mock/reconciliation-model');
    expect(result.metadata.tokensUsed).toBe(220);
    expect(result.metadata.costUsd).toBe(0.02);
  });

  it('returns RECONCILIATION_FAILED when provider throws', async () => {
    const generateObject = vi.fn(async () => {
      throw new Error('provider failed');
    });

    const { ReconciliationAgent } = await loadReconciliationAgent({
      generateObjectImpl: generateObject,
    });

    const agent = new ReconciliationAgent();
    const result = await agent.reconcile([], []);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RECONCILIATION_FAILED');
  });
});
