import { pythonML } from "./client";
import type {
	FraudAlert,
	InvoiceForAnalysis,
	VendorForAssessment,
} from "./types";

// ============================================
// Convenience Functions
// ============================================

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
