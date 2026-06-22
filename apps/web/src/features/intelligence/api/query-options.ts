import { queryOptions } from "@tanstack/react-query";
import {
	type AnomalyDetectionRequest,
	type CashflowRequest,
	type ComplianceRequest,
	type DocumentRequest,
	intelligenceApi,
	type SupplierRequest,
} from "./intelligence.api";
import { intelligenceKeys } from "./query-keys";

export function anomalyDetectionQueryOptions(data: AnomalyDetectionRequest) {
	return queryOptions({
		queryKey: intelligenceKeys.anomalies(data.companyId),
		queryFn: () => intelligenceApi.detectAnomalies(data),
	});
}

export function cashflowPredictionQueryOptions(data: CashflowRequest) {
	return queryOptions({
		queryKey: intelligenceKeys.cashflow(data.companyId),
		queryFn: () => intelligenceApi.predictCashflow(data),
	});
}

export function complianceCheckQueryOptions(data: ComplianceRequest) {
	return queryOptions({
		queryKey: intelligenceKeys.compliance(data.companyId),
		queryFn: () => intelligenceApi.checkCompliance(data),
	});
}

export function supplierIntelligenceQueryOptions(data: SupplierRequest) {
	return queryOptions({
		queryKey: intelligenceKeys.supplier(data.companyId),
		queryFn: () => intelligenceApi.analyzeSuppliers(data),
	});
}

export function documentClassificationQueryOptions(data: DocumentRequest) {
	return queryOptions({
		queryKey: intelligenceKeys.documents(data.companyId),
		queryFn: () => intelligenceApi.classifyDocuments(data),
	});
}
