/**
 * SUNAT Module Barrel Export
 * Centralized exports for SUNAT functionality
 */

export { SunatService } from "../sunat.service";
export {
	getExchangeRate,
	validateInvoiceNumbering,
} from "./invoice-utils";
export { generateInvoiceQR } from "./qr-generation";
export {
	getRucType,
	isValidRucFormat,
	validateRuc,
	validateRucOnline,
} from "./ruc-validation";
export type {
	ExchangeRateResult,
	InvoiceNumberingValidation,
	InvoiceXMLData,
	QRCodeData,
	RucType,
	RucValidationResult,
} from "./sunat-types";
export type { InvoiceData } from "./xml/invoice-generator";
export {
	UBLInvoiceGenerator,
	ublInvoiceGenerator,
} from "./xml/invoice-generator";
// UBL 2.1 XML Generator (New)
export {
	InvoiceItem,
	InvoiceNumber,
	MonetaryAmount,
	RUC,
} from "./xml/value-objects";
export { generateInvoiceXML } from "./xml-generation";
