/**
 * Invoice Numbering Validation Module
 * Validates invoice series and correlative numbers
 */

import { createLogger } from '../../lib/logger';
import type { ExchangeRateResult, InvoiceNumberingValidation } from './sunat-types';

const logger = createLogger({ module: 'services/sunat-invoice-utils' });

/**
 * Validate invoice numbering according to SUNAT rules
 */
export function validateInvoiceNumbering(
  series: string,
  correlative: number
): InvoiceNumberingValidation {
  // Validate series format (F001, B001, etc.)
  const seriesRegex = /^[FB]\d{3}$/;
  if (!seriesRegex.test(series)) {
    return {
      valid: false,
      message: 'Serie inválida. Debe ser F### para facturas o B### para boletas',
    };
  }

  // Validate correlative (must be between 1 and 99999999)
  if (correlative < 1 || correlative > 99999999) {
    return {
      valid: false,
      message: 'Correlativo inválido. Debe estar entre 1 y 99999999',
    };
  }

  return {
    valid: true,
    message: 'Numeración válida',
    series,
    correlative,
  };
}

/**
 * Get exchange rate from SBS/SUNAT
 * Uses apis.net.pe with caching
 */
export async function getExchangeRate(date?: string): Promise<ExchangeRateResult> {
  try {
    const { getExchangeRateFromAPI } = await import('./external-apis');
    return await getExchangeRateFromAPI(date);
  } catch (error) {
    logger.error({ error, date }, 'Error fetching exchange rate');
    
    // Fallback to mock data
    return {
      date: date || new Date().toISOString().split('T')[0],
      purchase: 3.75,
      sale: 3.76,
      source: 'Fallback - API Error',
    };
  }
}
