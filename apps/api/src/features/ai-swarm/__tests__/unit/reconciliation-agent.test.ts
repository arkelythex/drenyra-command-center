import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/openrouter.config', async () => {
  const actual = await vi.importActual<typeof import('../../config/openrouter.config')>(
    '../../config/openrouter.config',
  );

  return {
    ...actual,
    hasOpenRouterKey: () => false,
  };
});

import { ReconciliationAgent } from '../../agents/reconciliation.agent';

describe('ReconciliationAgent', () => {
  it('returns RECONCILIATION_NO_API_KEY when provider is disabled', async () => {
    const agent = new ReconciliationAgent();
    const result = await agent.reconcile([], []);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RECONCILIATION_NO_API_KEY');
    expect(result.metadata.agentType).toBe('reconciliation');
  });

  it('computes reconciliation stats deterministically', () => {
    const agent = new ReconciliationAgent();
    const stats = agent.calculateStats({
      matches: [
        {
          transactionId: 'TX-1',
          documentId: 'DOC-1',
          confidence: 0.95,
          matchType: 'exact',
          amountMatched: 118,
          difference: 0,
          evidence: 'same amount',
        },
        {
          transactionId: 'TX-2',
          documentId: 'DOC-2',
          confidence: 0.75,
          matchType: 'partial',
          amountMatched: 50,
          difference: 10,
          evidence: 'partial payment',
        },
      ],
      unmatched: {
        transactions: ['TX-9'],
        documents: ['DOC-9'],
      },
    });

    expect(stats.totalMatches).toBe(2);
    expect(stats.exactMatches).toBe(1);
    expect(stats.partialMatches).toBe(1);
    expect(stats.averageConfidence).toBeCloseTo(0.85, 4);
    expect(stats.totalUnmatched).toBe(2);
    expect(stats.matchRate).toBeCloseTo(0.5, 4);
  });
});
