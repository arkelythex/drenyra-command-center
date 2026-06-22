/**
 * SUNAT Service
 * Orchestrates SUNAT-related operations
 * Refactored following Single Responsibility Principle
 */

import {
  validateRuc,
  validateRucOnline,
  isValidRucFormat,
  getRucType,
} from './sunat/ruc-validation';
import { generateInvoiceXML } from './sunat/xml-generation';
import { generateInvoiceQR } from './sunat/qr-generation';
import {
  validateInvoiceNumbering,
  getExchangeRate,
} from './sunat/invoice-utils';

// Re-export types
export type {
  RucValidationResult,
  InvoiceXMLData,
  QRCodeData,
  ExchangeRateResult,
  InvoiceNumberingValidation,
  RucType,
} from './sunat/sunat-types';

export class SunatService {
  // RUC Validation
  static validateRuc = validateRuc;
  static validateRucOnline = validateRucOnline;
  static isValidRucFormat = isValidRucFormat;
  static getRucType = getRucType;

  // XML Generation
  static generateInvoiceXML = generateInvoiceXML;

  // QR Code Generation
  static generateInvoiceQR = generateInvoiceQR;

  // Invoice Utilities
  static validateInvoiceNumbering = validateInvoiceNumbering;
  static getExchangeRate = getExchangeRate;
}
