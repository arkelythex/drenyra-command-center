/**
 * Python ML Service Client
 *
 * HTTP client for fraud detection and financial analytics.
 */

import { z } from "zod";

// ============================================
// Configuration
// ============================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8002";
const ML_SERVICE_TIMEOUT = parseInt(
	process.env.ML_SERVICE_TIMEOUT || "30000",
	10,
);

// ============================================
// Schemas
// ============================================

/**
 * fraudAlertSchema const.
 *
 * @example
 * ```ts
 * console.log(fraudAlertSchema);
 * ```
 */
export const fraudAlertSchema = z.object({
	alert_type: z.string(),
	severity: z.enum(["low", "medium", "high", "critical"]),
	message: z.string(),
	recommendation: z.string(),
	confidence: z.number(),
	legal_basis: z.string().nullable().optional(),
});

/**
 * FraudAlert type.
 *
 * @example
 * ```ts
 * const value: FraudAlert = {} as FraudAlert;
 * console.log(value);
 * ```
 */
export type FraudAlert = z.infer<typeof fraudAlertSchema>;

/**
 * fraudAnalysisResultSchema const.
 *
 * @example
 * ```ts
 * console.log(fraudAnalysisResultSchema);
 * ```
 */
export const fraudAnalysisResultSchema = z.object({
	invoice_id: z.string(),
	is_suspicious: z.boolean(),
	risk_score: z.number(),
	risk_level: z.enum(["low", "medium", "high", "critical"]),
	alerts: z.array(fraudAlertSchema),
	processing_time_ms: z.number(),
});

/**
 * FraudAnalysisResult type.
 *
 * @example
 * ```ts
 * const value: FraudAnalysisResult = {} as FraudAnalysisResult;
 * console.log(value);
 * ```
 */
export type FraudAnalysisResult = z.infer<typeof fraudAnalysisResultSchema>;

/**
 * vendorRiskResultSchema const.
 *
 * @example
 * ```ts
 * console.log(vendorRiskResultSchema);
 * ```
 */
export const vendorRiskResultSchema = z.object({
	vendor_ruc: z.string(),
	risk_score: z.number(),
	risk_level: z.string(),
	red_flags: z.array(z.string()),
	recommendations: z.array(z.string()),
	is_likely_shell_company: z.boolean(),
	shell_company_confidence: z.number(),
});

/**
 * VendorRiskResult type.
 *
 * @example
 * ```ts
 * const value: VendorRiskResult = {} as VendorRiskResult;
 * console.log(value);
 * ```
 */
export type VendorRiskResult = z.infer<typeof vendorRiskResultSchema>;

/**
 * financialHealthResultSchema const.
 *
 * @example
 * ```ts
 * console.log(financialHealthResultSchema);
 * ```
 */
export const financialHealthResultSchema = z.object({
	organization_id: z.string(),
	health_score: z.number(),
	health_grade: z.string(),
	risk_areas: z.array(z.string()),
	recommendations: z.array(z.string()),
	industry_percentile: z.number().nullable().optional(),
});

/**
 * FinancialHealthResult type.
 *
 * @example
 * ```ts
 * const value: FinancialHealthResult = {} as FinancialHealthResult;
 * console.log(value);
 * ```
 */
export type FinancialHealthResult = z.infer<typeof financialHealthResultSchema>;

// ============================================
// Error Types
// ============================================

/**
 * MLServiceError class.
 *
 * @example
 * ```ts
 * const value = new MLServiceError();
 * console.log(value);
 * ```
 */
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

/**
 * InvoiceForAnalysis interface.
 *
 * @example
 * ```ts
 * const value: InvoiceForAnalysis = {} as InvoiceForAnalysis;
 * console.log(value);
 * ```
 */
export interface InvoiceForAnalysis {
	invoice_id: string;
	vendor_ruc: string;
	vendor_name: string;
	amount_cents: number;
	currency?: string;
	issue_date: string; // YYYY-MM-DD
	issue_time?: string; // HH:MM:SS
	document_type: string; // F, B, NC, ND
	serie_numero: string;
	vendor_creation_date?: string;
	vendor_address?: string;
	description?: string;
}

/**
 * VendorForAssessment interface.
 *
 * @example
 * ```ts
 * const value: VendorForAssessment = {} as VendorForAssessment;
 * console.log(value);
 * ```
 */
export interface VendorForAssessment {
	vendor_ruc: string;
	vendor_name: string;
	vendor_creation_date?: string;
	vendor_address?: string;
	invoice_count?: number;
	total_amount_cents?: number;
	average_amount_cents?: number;
}

/**
 * FinancialHealthInput interface.
 *
 * @example
 * ```ts
 * const value: FinancialHealthInput = {} as FinancialHealthInput;
 * console.log(value);
 * ```
 */
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

// ============================================
// Client Class
// ============================================

/**
 * PythonMLClient class.
 *
 * @example
 * ```ts
 * const value = new PythonMLClient();
 * console.log(value);
 * ```
 */
export class PythonMLClient {
	private baseUrl: string;
	private timeout: number;

	constructor(baseUrl?: string, timeout?: number) {
		this.baseUrl = baseUrl || ML_SERVICE_URL;
		this.timeout = timeout || ML_SERVICE_TIMEOUT;
	}

	/**
	 * Check if ML service is healthy
	 */
	async isHealthy(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Analyze a single invoice for fraud
	 */
	async analyzeInvoice(
		invoice: InvoiceForAnalysis,
	): Promise<FraudAnalysisResult> {
		const response = await this.makeRequest(
			"/v1/fraud/analyze-invoice",
			invoice,
		);

		const validated = fraudAnalysisResultSchema.safeParse(response);
		if (!validated.success) {
			throw new MLServiceError(
				"Invalid fraud analysis response",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Analyze multiple invoices for fraud
	 */
	async analyzeInvoiceBatch(
		invoices: InvoiceForAnalysis[],
		organizationId?: string,
	): Promise<{
		total_analyzed: number;
		suspicious_count: number;
		high_risk_count: number;
		average_risk_score: number;
		results: FraudAnalysisResult[];
	}> {
		const response = await this.makeRequest("/v1/fraud/analyze-batch", {
			invoices,
			include_historical_context: true,
			organization_id: organizationId,
		});

		return response as {
			total_analyzed: number;
			suspicious_count: number;
			high_risk_count: number;
			average_risk_score: number;
			results: FraudAnalysisResult[];
		};
	}

	/**
	 * Assess vendor risk for shell company detection
	 */
	async assessVendor(vendor: VendorForAssessment): Promise<VendorRiskResult> {
		const response = await this.makeRequest("/v1/fraud/assess-vendor", vendor);

		const validated = vendorRiskResultSchema.safeParse(response);
		if (!validated.success) {
			throw new MLServiceError(
				"Invalid vendor assessment response",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Calculate financial health score
	 */
	async calculateFinancialHealth(
		input: FinancialHealthInput,
	): Promise<FinancialHealthResult> {
		const response = await this.makeRequest(
			"/v1/analytics/financial-health",
			input,
		);

		const validated = financialHealthResultSchema.safeParse(response);
		if (!validated.success) {
			throw new MLServiceError(
				"Invalid financial health response",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Get fraud detection thresholds
	 */
	async getThresholds(): Promise<{
		detraccion_threshold_cents: number;
		round_number_tolerance: number;
		friday_5pm_suspicion_weight: number;
		new_vendor_months_threshold: number;
		amount_anomaly_std_devs: number;
		risk_levels: Record<string, { min: number; max: number }>;
	}> {
		const response = await fetch(`${this.baseUrl}/v1/fraud/thresholds`, {
			signal: AbortSignal.timeout(this.timeout),
		});

		if (!response.ok) {
			throw new MLServiceError(
				`ML service error: ${response.statusText}`,
				response.status,
			);
		}

		return response.json() as Promise<{
			detraccion_threshold_cents: number;
			round_number_tolerance: number;
			friday_5pm_suspicion_weight: number;
			new_vendor_months_threshold: number;
			amount_anomaly_std_devs: number;
			risk_levels: Record<string, { min: number; max: number }>;
		}>;
	}

	// ============================================
	// Private Methods
	// ============================================

	private async makeRequest(endpoint: string, data: unknown): Promise<unknown> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new MLServiceError(
					`ML service error: ${response.statusText}`,
					response.status,
					errorText,
				);
			}

			return response.json();
		} catch (error) {
			if (error instanceof MLServiceError) {
				throw error;
			}

			throw new MLServiceError(
				`ML request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

// ============================================
// Singleton Instance
// ============================================

/**
 * pythonML const.
 *
 * @example
 * ```ts
 * console.log(pythonML);
 * ```
 */
export const pythonML = new PythonMLClient();

// ============================================
// Convenience Functions
// ============================================

/**
 * Quick fraud check for a single invoice
 * @param invoice - Input for invoice.
 * @returns Result of checkInvoiceFraud.
 * @example
 * ```ts
 * const result = await checkInvoiceFraud({} as InvoiceForAnalysis);
 * console.log(result);
 * ```
 */

export async function checkInvoiceFraud(invoice: InvoiceForAnalysis): Promise<{
	isSuspicious: boolean;
	riskLevel: string;
	alerts: FraudAlert[];
}> {
	const result = await pythonML.analyzeInvoice(invoice);
	return {
		isSuspicious: result.is_suspicious,
		riskLevel: result.risk_level,
		alerts: result.alerts,
	};
}

/**
 * Check if vendor is a potential shell company
 * @param vendor - Input for vendor.
 * @returns Result of checkShellCompany.
 * @example
 * ```ts
 * const result = await checkShellCompany({} as VendorForAssessment);
 * console.log(result);
 * ```
 */

export async function checkShellCompany(vendor: VendorForAssessment): Promise<{
	isLikelyShellCompany: boolean;
	confidence: number;
	redFlags: string[];
}> {
	const result = await pythonML.assessVendor(vendor);
	return {
		isLikelyShellCompany: result.is_likely_shell_company,
		confidence: result.shell_company_confidence,
		redFlags: result.red_flags,
	};
}

/**
 * Get ML service status for monitoring
 * @returns Result of getMLServiceStatus.
 * @example
 * ```ts
 * const result = await getMLServiceStatus();
 * console.log(result);
 * ```
 */

export async function getMLServiceStatus(): Promise<{
	available: boolean;
	latency_ms?: number;
}> {
	const start = Date.now();
	const available = await pythonML.isHealthy();
	return {
		available,
		latency_ms: available ? Date.now() - start : undefined,
	};
}
