import { z } from "zod";

/**
 * CompanyContext interface.
 *
 * @example
 * ```ts
 * const value: CompanyContext = {} as CompanyContext;
 * console.log(value);
 * ```
 */
export interface CompanyContext {
	organizationId: number;
	ruc: string;
	businessName: string;
	industry: string;
	monthlyRevenue: number;
	avgRepresentationExpenses: number;
}

/**
 * ExpenseToAnalyze interface.
 *
 * @example
 * ```ts
 * const value: ExpenseToAnalyze = {} as ExpenseToAnalyze;
 * console.log(value);
 * ```
 */
export interface ExpenseToAnalyze {
	id: string;
	description: string;
	amount: number;
	vendorRuc?: string;
	vendorName?: string;
	category: string;
	date: Date;
}

/**
 * PLESIREDiscrepancy interface.
 *
 * @example
 * ```ts
 * const value: PLESIREDiscrepancy = {} as PLESIREDiscrepancy;
 * console.log(value);
 * ```
 */
export interface PLESIREDiscrepancy {
	id: string;
	type: "amount_mismatch" | "missing_in_ple" | "missing_in_sire" | "duplicated";
	pleRecord?: Record<string, unknown>;
	sireRecord?: Record<string, unknown>;
	discrepancyAmount?: number;
	detectedAt: Date;
}

const ComplianceAlertSchema = z.object({
	type: z.enum([
		"missing_documentation",
		"anomaly",
		"legal_risk",
		"limit_exceeded",
	]),
	severity: z.enum(["info", "warning", "error", "critical"]),
	message: z.string(),
	recommendation: z.string(),
	legalBasis: z.string().optional(),
});

const ComplianceAnalysisSchema = z.object({
	isCompliant: z.boolean(),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	alerts: z.array(ComplianceAlertSchema),
	requiredActions: z.array(z.string()),
	confidence: z.number().min(0).max(1),
});

const ProposedActionSchema = z.object({
	actionType: z.enum([
		"generate_nota_credito",
		"reclassify_expense",
		"request_documentation",
		"mark_non_deductible",
		"flag_for_review",
		"no_action_needed",
	]),
	reason: z.string(),
	affectedDocuments: z.array(z.string()),
	estimatedImpact: z
		.object({
			taxSavings: z.number().optional(),
			riskReduction: z.string().optional(),
		})
		.optional(),
	requiresApproval: z.boolean(),
});

/**
 * ComplianceAnalysis type.
 *
 * @example
 * ```ts
 * const value: ComplianceAnalysis = {} as ComplianceAnalysis;
 * console.log(value);
 * ```
 */
export type ComplianceAnalysis = z.infer<typeof ComplianceAnalysisSchema>;
/**
 * ProposedAction type.
 *
 * @example
 * ```ts
 * const value: ProposedAction = {} as ProposedAction;
 * console.log(value);
 * ```
 */
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
/**
 * ComplianceAlert type.
 *
 * @example
 * ```ts
 * const value: ComplianceAlert = {} as ComplianceAlert;
 * console.log(value);
 * ```
 */
export type ComplianceAlert = z.infer<typeof ComplianceAlertSchema>;

export {
	ComplianceAlertSchema,
	ComplianceAnalysisSchema,
	ProposedActionSchema,
};
