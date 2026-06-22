/**
 * External API Integration Module
 * Handles RUC validation and exchange rate APIs
 */

import { createLogger } from '../../lib/logger';
import type { RucValidationResult, ExchangeRateResult } from './sunat-types';

// Simple in-memory cache (can be replaced with Redis in production)
const rucCache = new Map<string, { data: RucValidationResult; timestamp: number }>();
const exchangeRateCache = new Map<string, { data: ExchangeRateResult; timestamp: number }>();
const logger = createLogger({ module: 'services/sunat-external-apis' });

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const API_TOKEN = process.env.APIS_NET_PE_TOKEN || ''; // Set in .env

export interface CacheStats {
  rucCacheSize: number;
  exchangeRateCacheSize: number;
  cacheTTL: number;
}

function maskRuc(ruc: string): string {
  if (ruc.length <= 4) return '***';
  return `${'*'.repeat(Math.max(0, ruc.length - 4))}${ruc.slice(-4)}`;
}

/**
 * Validate RUC using apis.net.pe API
 * Docs: https://apis.net.pe/api-ruc
 */
export async function validateRucWithAPI(ruc: string): Promise<RucValidationResult> {
  // Check cache first
  const cached = rucCache.get(ruc);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info({ rucMasked: maskRuc(ruc) }, 'RUC found in cache');
    return cached.data;
  }

  try {
    // Call apis.net.pe API
    const response = await fetch(
      `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Referer': process.env.API_URL || 'http://localhost:3000',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Map API response to our format
    const result: RucValidationResult = {
      valid: true,
      ruc,
      razonSocial: data.nombre || data.razonSocial,
      estado: data.estado,
      condicion: data.condicion,
      direccion: data.direccion,
      ubigeo: data.ubigeo,
      message: 'RUC válido y activo en SUNAT',
    };

    // Cache the result
    rucCache.set(ruc, { data: result, timestamp: Date.now() });
    logger.info({ rucMasked: maskRuc(ruc) }, 'RUC validated and cached');

    return result;
  } catch (error) {
    logger.error({ error, rucMasked: maskRuc(ruc) }, 'Error validating RUC with external API');
    
    // Return error result
    return {
      valid: false,
      ruc,
      message: `Error al consultar SUNAT: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get exchange rate from SBS/SUNAT
 * Uses apis.net.pe which consolidates SBS data
 */
export async function getExchangeRateFromAPI(date?: string): Promise<ExchangeRateResult> {
  const queryDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `exchange_${queryDate}`;

  // Check cache first
  const cached = exchangeRateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info({ queryDate }, 'Exchange rate found in cache');
    return cached.data;
  }

  try {
    // Call apis.net.pe tipo de cambio API
    const response = await fetch(
      `https://api.apis.net.pe/v2/sunat/tipo-cambio?fecha=${queryDate}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Referer': process.env.API_URL || 'http://localhost:3000',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    const result: ExchangeRateResult = {
      date: queryDate,
      purchase: parseFloat(data.compra || data.tipoCambioCompra),
      sale: parseFloat(data.venta || data.tipoCambioVenta),
      source: 'SBS/SUNAT via apis.net.pe',
    };

    // Cache the result
    exchangeRateCache.set(cacheKey, { data: result, timestamp: Date.now() });
    logger.info({ queryDate }, 'Exchange rate fetched and cached');

    return result;
  } catch (error) {
    logger.error({ error, queryDate }, 'Error fetching exchange rate from external API');
    
    // Return fallback data
    return {
      date: queryDate,
      purchase: 3.75,
      sale: 3.76,
      source: 'Fallback - API Error',
    };
  }
}

/**
 * Clear RUC cache (for manual refresh)
 */
export function clearRucCache(ruc?: string): void {
  if (ruc) {
    rucCache.delete(ruc);
    logger.info({ rucMasked: maskRuc(ruc) }, 'Cleared cache for RUC');
  } else {
    rucCache.clear();
    logger.info('Cleared all RUC cache');
  }
}

/**
 * Clear exchange rate cache (for manual refresh)
 */
export function clearExchangeRateCache(date?: string): void {
  if (date) {
    const cacheKey = `exchange_${date}`;
    exchangeRateCache.delete(cacheKey);
    logger.info({ queryDate: date }, 'Cleared cache for exchange rate');
  } else {
    exchangeRateCache.clear();
    logger.info('Cleared all exchange rate cache');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return {
    rucCacheSize: rucCache.size,
    exchangeRateCacheSize: exchangeRateCache.size,
    cacheTTL: CACHE_TTL,
  };
}
