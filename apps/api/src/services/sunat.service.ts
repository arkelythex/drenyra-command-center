/**
 * SUNAT Service
 * Orchestrates SUNAT-related operations
 * Refactored following Single Responsibility Principle
 */

import {
	getExchangeRate,
	validateInvoiceNumbering,
} from "./sunat/invoice-utils";
import { generateInvoiceQR } from "./sunat/qr-generation";
import {
	getRucType,
	isValidRucFormat,
	validateRuc,
	validateRucOnline,
} from "./sunat/ruc-validation";
import { generateInvoiceXML } from "./sunat/xml-generation";

// Re-export types
export type {
	ExchangeRateResult,
	InvoiceNumberingValidation,
	InvoiceXMLData,
	QRCodeData,
	RucType,
	RucValidationResult,
} from "./sunat/sunat-types";

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
