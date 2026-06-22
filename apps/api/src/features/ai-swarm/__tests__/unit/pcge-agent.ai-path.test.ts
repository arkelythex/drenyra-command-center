import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentCache } from '../../tools/cache';
import type { InvoiceData } from '../../config/types';

function buildInvoice(id: string): InvoiceData {
  return {
    id,
    ruc: '20100070970',
    serie: 'F001',
    numero: '00000001',
    fecha: '2026-02-18',
    moneda: 'PEN',
    subtotal: 100,
    igv: 18,
    total: 118,
    items: [
      {
        descripcion: 'Servicio',
        cantidad: 1,
        precioUnitario: 100,
        subtotal: 100,
      },
    ],
  };
}

async function loadPcgeAgent(options: {
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
      getModelForAgent: vi.fn(() => 'mock/pcge-model'),
      estimateCost: vi.fn(() => options.estimateCost ?? 0.01),
    };
  });

  return import('../../agents/pcge.agent');
}

describe('PCGEAgent AI path', () => {
  afterEach(() => {
    agentCache.clear();
    vi.restoreAllMocks();
    vi.doUnmock('ai');
    vi.doUnmock('../../config/openrouter.config');
  });

  it('classifies and caches accounting entries from model output', async () => {
    const generateObject = vi.fn(async () => ({
      object: {
        asientos: [
          {
            cuenta: '60111',
            descripcion: 'Compras',
            debe: 100,
            haber: 0,
            confidence: 0.94,
            evidence: 'servicio principal',
          },
          {
            cuenta: '42121',
            descripcion: 'Proveedores',
            debe: 0,
            haber: 100,
            confidence: 0.94,
          },
        ],
        glosa: 'Registro de compra',
      },
      usage: { totalTokens: 180 },
    }));

    const { PCGEAgent } = await loadPcgeAgent({
      generateObjectImpl: generateObject,
      estimateCost: 0.012,
    });

    const invoice = buildInvoice('INV-PCGE-AI-1');
    const agent = new PCGEAgent();
    const first = await agent.classifyInvoice(invoice);
    const second = await agent.classifyInvoice(invoice);

    expect(first.success).toBe(true);
    expect(first.metadata.modelUsed).toBe('mock/pcge-model');
    expect(first.metadata.tokensUsed).toBe(180);
    expect(first.metadata.costUsd).toBe(0.012);
    expect(second.success).toBe(true);
    expect(second.metadata.modelUsed).toBe('cache');
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it('returns PCGE_CLASSIFICATION_FAILED when model call throws', async () => {
    const generateObject = vi.fn(async () => {
      throw new Error('provider failure');
    });

    const { PCGEAgent } = await loadPcgeAgent({
      generateObjectImpl: generateObject,
    });

    const agent = new PCGEAgent();
    const result = await agent.classifyInvoice(buildInvoice('INV-PCGE-AI-ERR'));

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PCGE_CLASSIFICATION_FAILED');
  });
});
