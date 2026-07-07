import type { AgentContext } from "@drenyra/pi";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";

/** Base request body for intelligence endpoints */
export interface IntelligenceRequest {
	companyId: string;
	context: Pick<AgentContext, "tenantId" | "companyId" | "ruc">;
}

/** Anomaly detection request */
export interface AnomalyDetectionRequest extends IntelligenceRequest {
	igvInvoices?: Array<{
		id: string;
		serie: string;
		numero: string;
		tipoOperacion: string;
		baseImponible: number;
		igvCalculado: number;
		emisorRuc: string;
		emisionDate: string;
	}>;
	duplicateChecks?: Array<{
		id: string;
		serie: string;
		numero: string;
		total: number;
		emisorRuc: string;
		emisionDate: string;
	}>;
}

/** Cashflow prediction request */
export interface CashflowRequest extends IntelligenceRequest {
	transactions?: Array<{
		id: string;
		date: string;
		amount: number;
		type: "INCOME" | "EXPENSE";
		category: string;
	}>;
}

/** Compliance check request */
export interface ComplianceRequest extends IntelligenceRequest {
	obligations?: Array<{
		id: string;
		code: string;
		name: string;
		dueDate: string;
		status: "pending" | "filed" | "exempt";
		legalReference: string;
	}>;
}

/** Supplier intelligence request */
export interface SupplierRequest extends IntelligenceRequest {
	suppliers?: Array<{
		id: string;
		name: string;
		ruc: string;
		createdAt: string;
	}>;
	transactions?: Array<{
		id: string;
		supplierId: string;
		amount: number;
		issueDate: string;
		dueDate: string;
		paymentDate: string | null;
		paid: boolean;
	}>;
}

/** Document classification request */
export interface DocumentRequest extends IntelligenceRequest {
	documents?: Array<{
		id: string;
		filename?: string;
		text: string;
		serie?: string;
	}>;
}

export const intelligenceApi = {
	/** Run anomaly detection */
	detectAnomalies: async (data: AnomalyDetectionRequest) => {
		const body = await unwrap(api.api.intelligence.anomalies.post(data));
		return extractOkData(body, "intelligence.anomalies");
	},

	/** Run cashflow prediction */
	predictCashflow: async (data: CashflowRequest) => {
		const body = await unwrap(api.api.intelligence.cashflow.post(data));
		return extractOkData(body, "intelligence.cashflow");
	},

	/** Run compliance checks */
	checkCompliance: async (data: ComplianceRequest) => {
		const body = await unwrap(api.api.intelligence.compliance.post(data));
		return extractOkData(body, "intelligence.compliance");
	},

	/** Run supplier intelligence */
	analyzeSuppliers: async (data: SupplierRequest) => {
		const body = await unwrap(api.api.intelligence.supplier.post(data));
		return extractOkData(body, "intelligence.supplier");
	},

	/** Classify documents */
	classifyDocuments: async (data: DocumentRequest) => {
		const body = await unwrap(api.api.intelligence.classify.post(data));
		return extractOkData(body, "intelligence.classify");
	},
};
