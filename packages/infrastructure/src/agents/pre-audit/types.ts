import { z } from "zod";

/**
 * AuditFindingSchema const.
 *
 * @example
 * ```ts
 * console.log(AuditFindingSchema);
 * ```
 */
export const AuditFindingSchema = z.object({
	code: z.string(),
	severity: z.enum(["low", "medium", "high", "critical"]),
	category: z.enum([
		"igv_inconsistency",
		"missing_document",
		"duplicate_entry",
		"detraccion_omission",
		"vendor_risk",
		"representation_limit",
		"non_deductible",
	]),
	description: z.string(),
	affectedDocuments: z.array(z.string()),
	estimatedImpact: z.number(),
	suggestedCorrection: z.string(),
});

/**
 * AuditFinding type.
 *
 * @example
 * ```ts
 * const value: AuditFinding = {} as AuditFinding;
 * console.log(value);
 * ```
 */
export type AuditFinding = z.infer<typeof AuditFindingSchema>;

/**
 * AuditReportSchema const.
 *
 * @example
 * ```ts
 * console.log(AuditReportSchema);
 * ```
 */
export const AuditReportSchema = z.object({
	organizationId: z.number(),
	period: z.string(),
	executedAt: z.string(),
	findings: z.array(AuditFindingSchema),
	summary: z.object({
		totalFindings: z.number(),
		bySeverity: z.object({
			low: z.number(),
			medium: z.number(),
			high: z.number(),
			critical: z.number(),
		}),
		estimatedTotalRisk: z.number(),
	}),
	overallRiskScore: z.number().min(0).max(100),
	recommendations: z.array(z.string()),
});

/**
 * AuditReport type.
 *
 * @example
 * ```ts
 * const value: AuditReport = {} as AuditReport;
 * console.log(value);
 * ```
 */
export type AuditReport = z.infer<typeof AuditReportSchema>;

export interface AuditCheckContext {
	invoices: Invoice[];
	expenses: Expense[];
	bankTransactions: BankTransaction[];
	period: string;
}

export interface Invoice {
	id: string;
	series: string;
	number: string;
	ruc: string;
	vendorName: string;
	igv: number;
	total: number;
	issueDate: string;
	hasDetraccion: boolean;
	detractionAmount?: number;
}

export interface Expense {
	id: string;
	invoiceId?: string;
	category: string;
	amount: number;
	description: string;
	isDeductible: boolean;
}

export interface BankTransaction {
	id: string;
	date: string;
	amount: number;
	description: string;
	matchedInvoiceId?: string;
}
