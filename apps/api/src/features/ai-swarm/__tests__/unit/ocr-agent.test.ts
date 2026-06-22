import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult, InvoiceData } from '../../config/types';

vi.mock('../../config/openrouter.config', async () => {
  const actual = await vi.importActual<typeof import('../../config/openrouter.config')>(
    '../../config/openrouter.config',
  );

  return {
    ...actual,
    hasOpenRouterKey: () => false,
  };
});

import { OCRAgent } from '../../agents/ocr.agent';

describe('OCRAgent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns OCR_NO_API_KEY when provider credentials are unavailable', async () => {
    const agent = new OCRAgent();

    const result = await agent.extractInvoice('data:image/png;base64,AA==', 'INV-OCR-001');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('OCR_NO_API_KEY');
    expect(result.metadata.agentType).toBe('ocr');
  });

  it('extractBatch delegates to extractInvoice for each input in order', async () => {
    const successResult: AgentResult<InvoiceData> = {
      success: true,
      data: {
        id: 'INV-BATCH-OK',
        ruc: '20100070970',
        serie: 'F001',
        numero: '00000001',
        fecha: '2026-02-18',
        moneda: 'PEN',
        subtotal: 100,
        igv: 18,
        total: 118,
        items: [],
      },
      metadata: {
        agentType: 'ocr',
        modelUsed: 'mock',
        tokensUsed: 0,
        costUsd: 0,
        durationMs: 1,
        timestamp: new Date(),
      },
    };

    const spy = vi
      .spyOn(OCRAgent.prototype, 'extractInvoice')
      .mockResolvedValue(successResult);

    const agent = new OCRAgent();
    const batch = await agent.extractBatch([
      { url: 'img://1', id: 'DOC-1' },
      { url: 'img://2', id: 'DOC-2' },
      { url: 'img://3', id: 'DOC-3' },
    ]);

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(1, 'img://1', 'DOC-1');
    expect(spy).toHaveBeenNthCalledWith(2, 'img://2', 'DOC-2');
    expect(spy).toHaveBeenNthCalledWith(3, 'img://3', 'DOC-3');
    expect(batch).toHaveLength(3);
    expect(batch.every((result) => result.success)).toBe(true);
  });
});
