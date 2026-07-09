/**
 * TaxComplianceLens — Does the operation comply with current SUNAT regulations?
 *
 * Checks that:
 * - The operation references valid invoice types (01, 03, 07, 08, etc.)
 * - Required fiscal fields are present (RUC, IGV, total)
 * - The operation is within the current fiscal period
 */

import type {
	EvidenceInput,
	FiscalReviewLens,
	LensContext,
	LensFinding,
	LensResult,
} from "./lens.interface";

/** Valid SUNAT invoice types. */
const VALID_INVOICE_TYPES = new Set([
	"01",
	"03",
	"07",
	"08",
	"20",
	"40",
	"50",
	"52",
	"53",
	"54",
	"55",
	"56",
	"87",
]);

/** Minimum required fiscal fields on invoice output. */
const REQUIRED_FISCAL_FIELDS = [
	"issuerRuc",
	"customerRuc",
	"invoiceNumber",
	"total",
	"igv",
	"invoiceType",
];

export class TaxComplianceLens implements FiscalReviewLens {
	name = "Tax Compliance";
	id = "tax-compliance";
	version = "1.0.0";

	async review(evidence: EvidenceInput, ctx: LensContext): Promise<LensResult> {
		const findings: LensFinding[] = [];
		const output =
			(evidence.output as Record<string, unknown> | undefined) ?? {};

		// 1. Check invoice type validity
		const invoiceType = String(output.invoiceType ?? "");
		if (invoiceType && !VALID_INVOICE_TYPES.has(invoiceType)) {
			findings.push({
				severity: "CRITICAL",
				code: "TAX-001",
				message: `Invalid invoice type: "${invoiceType}". Must be one of: ${[...VALID_INVOICE_TYPES].join(", ")}`,
				evidence: `invoiceType=${invoiceType}`,
			});
		}

		// 2. Check required fiscal fields
		const missingFields = REQUIRED_FISCAL_FIELDS.filter(
			(f) => output[f] === undefined || output[f] === null || output[f] === "",
		);
		if (missingFields.length > 0) {
			findings.push({
				severity:
					missingFields.includes("issuerRuc") || missingFields.includes("total")
						? "CRITICAL"
						: "WARNING",
				code: "TAX-002",
				message: `Missing required fiscal fields: ${missingFields.join(", ")}`,
				evidence: `missingFields=${missingFields.join(",")}`,
			});
		}

		// 3. Check fiscal period alignment
		if (ctx.fiscalCalendar) {
			const period = `${ctx.fiscalCalendar.year}-${ctx.fiscalCalendar.period}`;
			const operationPeriod = evidence.metadata?.period as string | undefined;
			if (operationPeriod && operationPeriod !== period) {
				findings.push({
					severity: "WARNING",
					code: "TAX-003",
					message: `Operation period "${operationPeriod}" differs from current fiscal period "${period}"`,
					evidence: `operationPeriod=${operationPeriod}, currentPeriod=${period}`,
				});
			}
		}

		// 4. Check RUC format validity
		const issuerRuc = String(output.issuerRuc ?? "");
		if (issuerRuc && !/^\d{11}$/.test(issuerRuc)) {
			findings.push({
				severity: "CRITICAL",
				code: "TAX-004",
				message: `Invalid issuer RUC format: "${issuerRuc}". Must be 11 digits.`,
				evidence: `issuerRuc=${issuerRuc}`,
			});
		}

		const criticalCount = findings.filter(
			(f) => f.severity === "CRITICAL",
		).length;
		const passed = criticalCount === 0;
		const score = passed
			? Math.max(0.5, 1 - findings.length * 0.1)
			: Math.max(0, 0.5 - criticalCount * 0.2);

		return {
			passed,
			score,
			findings,
			confidence: findings.length === 0 ? 0.95 : 0.7,
		};
	}
}
