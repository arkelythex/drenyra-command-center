import type { ValidationError } from "../value-objects/validation-result.vo";

type StructuralRule = {
	code: string;
	field: string;
	fragment: string;
	message: string;
};

const REQUIRED_STRUCTURAL_RULES: StructuralRule[] = [
	{
		code: "MISSING_INVOICE_TYPE_CODE",
		field: "cbc:InvoiceTypeCode",
		fragment: "<cbc:InvoiceTypeCode",
		message: "Missing SUNAT-required <cbc:InvoiceTypeCode> element",
	},
	{
		code: "MISSING_DOCUMENT_CURRENCY_CODE",
		field: "cbc:DocumentCurrencyCode",
		fragment: "<cbc:DocumentCurrencyCode",
		message: "Missing SUNAT-required <cbc:DocumentCurrencyCode> element",
	},
	{
		code: "MISSING_TAX_TOTAL",
		field: "cac:TaxTotal",
		fragment: "<cac:TaxTotal>",
		message: "Missing SUNAT-required <cac:TaxTotal> block",
	},
	{
		code: "MISSING_TAX_AMOUNT",
		field: "cbc:TaxAmount",
		fragment: "<cbc:TaxAmount",
		message: "Missing SUNAT-required <cbc:TaxAmount> element",
	},
];

const ALLOWED_IGV_PERCENTAGES_2026 = new Set([
	0,
	2,
	4,
	8,
	9,
	9.5,
	10,
	10.5,
	18,
]);

/**
 * SunatStructuralRules2026Service class.
 *
 * @example
 * ```ts
 * const value = new SunatStructuralRules2026Service();
 * console.log(value);
 * ```
 */
export class SunatStructuralRules2026Service {
	validate(xml: string): {
		errors: ValidationError[];
		warnings: string[];
	} {
		const errors: ValidationError[] = [];
		const warnings: string[] = [];

		for (const rule of REQUIRED_STRUCTURAL_RULES) {
			if (!xml.includes(rule.fragment)) {
				errors.push({
					code: rule.code,
					field: rule.field,
					message: rule.message,
				});
			}
		}

		const payableAmount = this.extractDecimal(xml, "cbc:PayableAmount");
		const taxAmount = this.extractDecimal(xml, "cbc:TaxAmount");

		if (payableAmount === null) {
			errors.push({
				code: "INVALID_PAYABLE_AMOUNT",
				field: "cbc:PayableAmount",
				message:
					"Missing or invalid numeric value in <cbc:PayableAmount> for SUNAT structural validation",
			});
		}

		if (taxAmount === null && xml.includes("<cbc:TaxAmount")) {
			errors.push({
				code: "INVALID_TAX_AMOUNT",
				field: "cbc:TaxAmount",
				message:
					"Missing or invalid numeric value in <cbc:TaxAmount> for SUNAT structural validation",
			});
		}

		if (
			payableAmount !== null &&
			taxAmount !== null &&
			taxAmount > payableAmount
		) {
			errors.push({
				code: "INCONSISTENT_TOTALS",
				field: "cbc:TaxAmount",
				message:
					"Tax amount cannot exceed payable amount in the current SUNAT structural baseline",
			});
		}

		if (!this.hasCurrencyAttribute(xml, "cbc:PayableAmount")) {
			warnings.push(
				"Missing currencyID on <cbc:PayableAmount>; SUNAT validations often expect explicit currency context",
			);
		}

		if (xml.includes("<cbc:TaxAmount") && !this.hasCurrencyAttribute(xml, "cbc:TaxAmount")) {
			warnings.push(
				"Missing currencyID on <cbc:TaxAmount>; declare currency explicitly to reduce SUNAT observations",
			);
		}

		this.validateProductClassificationCodes(xml, warnings);
		this.validateIgvPercentages(xml, warnings);

		return { errors, warnings };
	}

	private validateProductClassificationCodes(
		xml: string,
		warnings: string[],
	): void {
		const invoiceLines = xml.match(/<cac:InvoiceLine\b[\s\S]*?<\/cac:InvoiceLine>/g) ?? [];

		for (const [index, line] of invoiceLines.entries()) {
			if (!line.includes("<cac:Item")) {
				continue;
			}

			const standardCode = this.extractTagValue(line, "cbc:ItemClassificationCode");
			if (!standardCode) {
				warnings.push(
					`OBS-3496: La linea ${index + 1} no incluye un codigo estandar de producto (<cbc:ItemClassificationCode>). SUNAT observa CPE sin clasificacion homologada desde febrero 2026.`,
				);
				continue;
			}

			if (!/^\d{8}$/.test(standardCode.trim())) {
				warnings.push(
					`OBS-3496: La linea ${index + 1} usa el codigo de producto "${standardCode}", pero SUNAT espera exactamente 8 digitos en el baseline febrero 2026.`,
				);
			}
		}
	}

	private validateIgvPercentages(xml: string, warnings: string[]): void {
		const matches = xml.matchAll(
			/<cbc:Percent[^>]*>(-?\d+(?:\.\d+)?)<\/cbc:Percent>/g,
		);

		for (const match of matches) {
			const parsed = Number(match[1]);
			if (!Number.isFinite(parsed)) {
				continue;
			}

			if (!ALLOWED_IGV_PERCENTAGES_2026.has(parsed)) {
				warnings.push(
					`OBS-4332: La tasa IGV ${parsed.toFixed(2)} no esta dentro del baseline febrero 2026 (0, 2, 4, 8, 9, 9.5, 10, 10.5, 18).`,
				);
			}
		}
	}

	private extractDecimal(xml: string, tagName: string): number | null {
		const escapedTag = tagName.replace(":", "\\:");
		const pattern = new RegExp(
			`<${escapedTag}[^>]*>(-?\\d+(?:\\.\\d+)?)<\\/${escapedTag}>`,
		);
		const match = xml.match(pattern);
		if (!match) {
			return null;
		}

		const parsed = Number(match[1]);
		return Number.isFinite(parsed) ? parsed : null;
	}

	private extractTagValue(xml: string, tagName: string): string | null {
		const escapedTag = tagName.replace(":", "\\:");
		const pattern = new RegExp(`<${escapedTag}[^>]*>([^<]+)<\\/${escapedTag}>`);
		const match = xml.match(pattern);
		return typeof match?.[1] === "string" ? match[1] : null;
	}

	private hasCurrencyAttribute(xml: string, tagName: string): boolean {
		const escapedTag = tagName.replace(":", "\\:");
		const pattern = new RegExp(
			`<${escapedTag}[^>]*\\scurrencyID=["'][A-Z]{3}["'][^>]*>`,
		);
		return pattern.test(xml);
	}
}
