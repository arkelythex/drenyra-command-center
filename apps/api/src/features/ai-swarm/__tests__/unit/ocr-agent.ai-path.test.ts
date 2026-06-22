import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InvoiceData } from '../../config/types';

async function loadOcrAgent(options: {
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
      getModelForAgent: vi.fn(() => 'mock/ocr-model'),
      estimateCost: vi.fn(() => options.estimateCost ?? 0.02),
    };
  });

  return import('../../agents/ocr.agent');
}

describe('OCRAgent AI path', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('ai');
    vi.doUnmock('../../config/openrouter.config');
  });

  it('extracts invoice data with model metadata and cost', async () => {
    const mockedInvoice = {
      ruc: '20100070970',
      serie: 'F001',
      numero: '00000010',
      fecha: '2026-02-18',
      moneda: 'PEN',
      subtotal: 100,
      igv: 18,
      total: 118,
      items: [],
    } satisfies Omit<InvoiceData, 'id'>;

    const generateObject = vi.fn(async () => ({
      object: mockedInvoice,
      usage: { totalTokens: 200 },
    }));

    const { OCRAgent } = await loadOcrAgent({
      generateObjectImpl: generateObject,
      estimateCost: 0.02,
    });

    const agent = new OCRAgent();
    const result = await agent.extractInvoice('data:image/png;base64,AA==', 'INV-OCR-OK');

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('INV-OCR-OK');
    expect(result.metadata.modelUsed).toBe('mock/ocr-model');
    expect(result.metadata.tokensUsed).toBe(200);
    expect(result.metadata.costUsd).toBe(0.02);
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it('returns OCR_EXTRACTION_FAILED when provider call throws', async () => {
    const generateObject = vi.fn(async () => {
      throw new Error('upstream timeout');
    });

    const { OCRAgent } = await loadOcrAgent({
      generateObjectImpl: generateObject,
    });

    const agent = new OCRAgent();
    const result = await agent.extractInvoice('data:image/png;base64,AA==', 'INV-OCR-ERR');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('OCR_EXTRACTION_FAILED');
  });
});
