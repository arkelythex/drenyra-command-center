import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearExchangeRateCache,
  clearRucCache,
  getCacheStats,
  getExchangeRateFromAPI,
  validateRucWithAPI,
} from '../sunat/external-apis';

const ORIGINAL_FETCH = globalThis.fetch;

describe('sunat/external-apis', () => {
  beforeEach(() => {
    clearRucCache();
    clearExchangeRateCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    clearRucCache();
    clearExchangeRateCache();
  });

  it('caches successful RUC validations and avoids duplicate fetches', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          razonSocial: 'ARKELYTHEX S.A.C.',
          estado: 'ACTIVO',
          condicion: 'HABIDO',
          direccion: 'Lima',
          ubigeo: '150101',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    globalThis.fetch = fetchMock as typeof fetch;

    const first = await validateRucWithAPI('20100070970');
    const second = await validateRucWithAPI('20100070970');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.valid).toBe(true);
    expect(second.razonSocial).toBe('ARKELYTHEX S.A.C.');
    expect(getCacheStats().rucCacheSize).toBe(1);
  });

  it('returns fallback exchange rate when external API fails', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as typeof fetch;

    const result = await getExchangeRateFromAPI('2026-03-21');

    expect(result).toEqual({
      date: '2026-03-21',
      purchase: 3.75,
      sale: 3.76,
      source: 'Fallback - API Error',
    });
  });

  it('clears specific cache entries without touching other buckets', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/ruc?')) {
        return new Response(
          JSON.stringify({
            nombre: 'Empresa Demo',
            estado: 'ACTIVO',
            condicion: 'HABIDO',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      }

      return new Response(
        JSON.stringify({
          compra: '3.70',
          venta: '3.80',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    }) as typeof fetch;

    await validateRucWithAPI('20100070970');
    await getExchangeRateFromAPI('2026-03-21');

    clearRucCache('20100070970');

    const stats = getCacheStats();
    expect(stats.rucCacheSize).toBe(0);
    expect(stats.exchangeRateCacheSize).toBe(1);
  });
});
