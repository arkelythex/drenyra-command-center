import {
	fraudAnalysisResultSchema,
	vendorRiskResultSchema,
	financialHealthResultSchema,
	MLServiceError,
	type FraudAnalysisResult,
	type VendorRiskResult,
	type FinancialHealthResult,
	type InvoiceForAnalysis,
	type VendorForAssessment,
	type FinancialHealthInput,
} from "./types";

// ============================================
// Configuration
// ============================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8002";
const ML_SERVICE_TIMEOUT = parseInt(
	process.env.ML_SERVICE_TIMEOUT || "30000",
	10,
);

// ============================================
// Client Class
// ============================================

export class PythonMLClient {
	private baseUrl: string;
	private timeout: number;

	constructor(baseUrl?: string, timeout?: number) {
		this.baseUrl = baseUrl || ML_SERVICE_URL;
		this.timeout = timeout || ML_SERVICE_TIMEOUT;
	}

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

	async assessVendor(vendor: VendorForAssessment): Promise<VendorRiskResult> {
		const response = await this.makeRequest(
			"/v1/fraud/assess-vendor",
			vendor,
		);

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

	private async makeRequest(
		endpoint: string,
		data: unknown,
	): Promise<unknown> {
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

export const pythonML = new PythonMLClient();
