import { z } from "zod";

// ============================================
// Schemas
// ============================================

export const fraudAlertSchema = z.object({
	alert_type: z.string(),
	severity: z.enum(["low", "medium", "high", "critical"]),
	message: z.string(),
	recommendation: z.string(),
	confidence: z.number(),
	legal_basis: z.string().nullable().optional(),
});

export type FraudAlert = z.infer<typeof fraudAlertSchema>;

export const fraudAnalysisResultSchema = z.object({
	invoice_id: z.string(),
	is_suspicious: z.boolean(),
	risk_score: z.number(),
	risk_level: z.enum(["low", "medium", "high", "critical"]),
	alerts: z.array(fraudAlertSchema),
	processing_time_ms: z.number(),
});

export type FraudAnalysisResult = z.infer<typeof fraudAnalysisResultSchema>;

export const vendorRiskResultSchema = z.object({
	vendor_ruc: z.string(),
	risk_score: z.number(),
	risk_level: z.string(),
	red_flags: z.array(z.string()),
	recommendations: z.array(z.string()),
	is_likely_shell_company: z.boolean(),
	shell_company_confidence: z.number(),
});

export type VendorRiskResult = z.infer<typeof vendorRiskResultSchema>;

export const financialHealthResultSchema = z.object({
	organization_id: z.string(),
	health_score: z.number(),
	health_grade: z.string(),
	risk_areas: z.array(z.string()),
	recommendations: z.array(z.string()),
	industry_percentile: z.number().nullable().optional(),
});

export type FinancialHealthResult = z.infer<typeof financialHealthResultSchema>;

// ============================================
// Error Types
// ============================================

export class MLServiceError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public details?: unknown,
	) {
		super(message);
		this.name = "MLServiceError";
	}
}

// ============================================
// Input Types
// ============================================

export interface InvoiceForAnalysis {
	invoice_id: string;
	vendor_ruc: string;
	vendor_name: string;
	amount_cents: number;
	currency?: string;
	issue_date: string;
	issue_time?: string;
	document_type: string;
	serie_numero: string;
	vendor_creation_date?: string;
	vendor_address?: string;
	description?: string;
}

export interface VendorForAssessment {
	vendor_ruc: string;
	vendor_name: string;
	vendor_creation_date?: string;
	vendor_address?: string;
	invoice_count?: number;
	total_amount_cents?: number;
	average_amount_cents?: number;
}

export interface FinancialHealthInput {
	organization_id: string;
	current_ratio?: number;
	quick_ratio?: number;
	debt_ratio?: number;
	monthly_revenue_cents: number;
	monthly_expenses_cents: number;
	accounts_receivable_cents: number;
	accounts_payable_cents: number;
	industry?: string;
	company_age_months?: number;
}
