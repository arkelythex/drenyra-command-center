import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agentCache } from '../../tools/cache';
import type { InvoiceData, PCGEClassification } from '../../config/types';

vi.mock('../../config/openrouter.config', async () => {
  const actual = await vi.importActual<typeof import('../../config/openrouter.config')>(
    '../../config/openrouter.config',
  );

  return {
    ...actual,
    hasOpenRouterKey: () => false,
  };
});

import { PCGEAgent } from '../../agents/pcge.agent';

function buildInvoice(partial?: Partial<InvoiceData>): InvoiceData {
  return {
    id: partial?.id ?? 'INV-PCGE-001',
    ruc: partial?.ruc ?? '20100070970',
    serie: partial?.serie ?? 'F001',
    numero: partial?.numero ?? '00000001',
    fecha: partial?.fecha ?? '2026-02-18',
    moneda: partial?.moneda ?? 'PEN',
    subtotal: partial?.subtotal ?? 100,
    igv: partial?.igv ?? 18,
    total: partial?.total ?? 118,
    items: partial?.items ?? [],
  };
}

describe('PCGEAgent', () => {
  beforeEach(() => {
    agentCache.clear();
    vi.restoreAllMocks();
  });

  it('returns cached classification without requiring LLM key', async () => {
    const invoice = buildInvoice();
    const cachedData: PCGEClassification[] = [
      {
        cuenta: '60111',
        descripcion: 'Mercaderias',
        debe: 100,
        haber: 0,
        confidence: 0.99,
      },
      {
        cuenta: '40111',
        descripcion: 'IGV credito fiscal',
        debe: 18,
        haber: 0,
        confidence: 0.99,
      },
      {
        cuenta: '42121',
        descripcion: 'Proveedores',
        debe: 0,
        haber: 118,
        confidence: 0.99,
      },
    ];

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
    agentCache.set('pcge', cacheInput, cachedData, 0);

    const agent = new PCGEAgent();
    const result = await agent.classifyInvoice(invoice);

    expect(result.success).toBe(true);
    expect(result.metadata.modelUsed).toBe('cache');
    expect(result.data).toEqual(cachedData);
  });

  it('returns PCGE_NO_API_KEY when cache is empty and provider is disabled', async () => {
    const agent = new PCGEAgent();
    const result = await agent.classifyInvoice(buildInvoice({ id: 'INV-PCGE-002' }));

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PCGE_NO_API_KEY');
    expect(result.metadata.agentType).toBe('pcge');
  });

  it('validates accounting balance with cent-level tolerance', () => {
    const agent = new PCGEAgent();

    const balanced = agent.validateBalance([
      { cuenta: '60', descripcion: 'Compras', debe: 100, haber: 0, confidence: 1 },
      { cuenta: '40', descripcion: 'IGV', debe: 18, haber: 0, confidence: 1 },
      { cuenta: '42', descripcion: 'Proveedores', debe: 0, haber: 118, confidence: 1 },
    ]);

    const unbalanced = agent.validateBalance([
      { cuenta: '60', descripcion: 'Compras', debe: 100, haber: 0, confidence: 1 },
      { cuenta: '42', descripcion: 'Proveedores', debe: 0, haber: 117.9, confidence: 1 },
    ]);

    expect(balanced.isBalanced).toBe(true);
    expect(unbalanced.isBalanced).toBe(false);
    expect(unbalanced.difference).toBeGreaterThanOrEqual(0.1);
  });
});
