/**
 * MinimalDataGate — ensures critical invoice fields are present after extraction.
 *
 * Validates that the reader/parser output contains all required fields
 * before passing to the next orchestrator phase.
 */

import type {
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "../types";

/** Fields required for any invoice processing to proceed. */
export const REQUIRED_INVOICE_FIELDS = [
	"issuerRuc",
	"invoiceNumber",
	"total",
	"issueDate",
] as const;

/** Additional fields required for fiscal compliance. */
export const REQUIRED_FISCAL_FIELDS = [
	"customerRuc",
	"subtotal",
	"igv",
	"invoiceType",
] as const;

export interface MinimalDataCheckInput {
	extractedData?: Record<string, unknown>;
	parsedData?: Record<string, unknown>;
	[key: string]: unknown;
}

/**
 * Gate that checks for minimal required fields in extracted/parsed data.
 * BLOCKING if any required field is missing.
 */
export const MINIMAL_READER_GATE: GatekeeperCheck<MinimalDataCheckInput> = {
	name: "MinimalDataGate",
	description: "Ensures critical invoice fields are present after extraction",

	check: (data, _ctx: GatekeeperContext): GatekeeperVerdict => {
		const source = data.extractedData ?? data.parsedData ?? data;
		if (typeof source !== "object" || source === null) {
			return {
				passed: false,
				reasons: ["No data object available for validation"],
				severity: "BLOCKING",
				details: { receivedType: typeof source },
			};
		}

		const missingRequired = REQUIRED_INVOICE_FIELDS.filter(
			(field) =>
				!(field in source) ||
				source[field] === undefined ||
				source[field] === null,
		);

		const missingFiscal = REQUIRED_FISCAL_FIELDS.filter(
			(field) =>
				!(field in source) ||
				source[field] === undefined ||
				source[field] === null,
		);

		if (missingRequired.length > 0) {
			return {
				passed: false,
				reasons: missingRequired.map((f) => `Missing required field: ${f}`),
				severity: "BLOCKING",
				details: {
					missingRequired,
					missingFiscal,
					presentFields: Object.keys(source),
				},
			};
		}

		if (missingFiscal.length > 0) {
			return {
				passed: true,
				reasons: missingFiscal.map(
					(f) => `Missing fiscal field (non-blocking): ${f}`,
				),
				severity: "WARNING",
				details: { missingFiscal },
			};
		}

		return {
			passed: true,
			reasons: ["All required fields present"],
			severity: "INFO",
			details: { fieldCount: Object.keys(source).length },
		};
	},
};
