import { queryOptions } from "@tanstack/react-query";
import { getHttpStatusCode } from "@/lib/http-client";
import { captureError } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";
import {
	analyticsApi,
	DASHBOARD_ANALYTICS_FALLBACK,
} from "./api/analytics.api";
import {
	type DashboardFiscalIndicatorsResponse,
	type DashboardRecentTransaction,
	type DashboardSummaryResponse,
	dashboardApi,
} from "./api/dashboard.api";
import { dashboardKeys } from "./dashboard.query-keys";

const DASHBOARD_FALLBACK_STATUSES = new Set([404, 405, 501, 502, 503, 504]);
const SUPPRESSIBLE_HTTP_STATUSES = new Set([404, 405, 501]);

function shouldUseDashboardFallback(error: unknown): boolean {
	const status = getHttpStatusCode(error);
	if (typeof status !== "number") return true;
	return DASHBOARD_FALLBACK_STATUSES.has(status);
}

function captureDashboardFallbackError(
	error: unknown,
	source: string,
	companyId: string,
): void {
	captureError(
		error instanceof Error ? error : new Error("Dashboard request failed"),
		{
			companyId,
			source,
			status: getHttpStatusCode(error) ?? null,
		},
	);
}

export function dashboardOverviewQueryOptions(companyId: string) {
	const useFallbackOnly = runtimeConfig.mockMode;

	return queryOptions({
		queryKey: dashboardKeys.overview(companyId),
		queryFn: async () => {
			if (useFallbackOnly) {
				return DASHBOARD_ANALYTICS_FALLBACK;
			}

			try {
				return await analyticsApi.getDashboard({ companyId, currency: "PEN" });
			} catch (requestError) {
				if (shouldUseDashboardFallback(requestError)) {
					captureDashboardFallbackError(
						requestError,
						"features/dashboard/dashboardOverviewQueryOptions",
						companyId,
					);
					return DASHBOARD_ANALYTICS_FALLBACK;
				}
				throw requestError;
			}
		},
		refetchInterval: (query) =>
			query.state.data?.__source === "fallback" ? false : 60_000,
		staleTime: 60_000,
	});
}

export function dashboardSummaryQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: dashboardKeys.summary(companyId),
		queryFn: async () => {
			if (runtimeConfig.mockMode) return null;
			try {
				const result = await dashboardApi.getSummary(companyId);
				if (!result.ok) return null;
				return result.data;
			} catch (error) {
				const status = getHttpStatusCode(error);
				if (!SUPPRESSIBLE_HTTP_STATUSES.has(status ?? -1)) {
					captureDashboardFallbackError(
						error,
						"features/dashboard/dashboardSummaryQueryOptions",
						companyId,
					);
				}
				return null;
			}
		},
		staleTime: 60_000,
	});
}

export interface ProcessedDocument {
	id: string;
	name: string;
	type: "PDF" | "XML";
	ruc?: string;
	amount?: number;
	status: string;
	date: string;
	confidence?: number;
	extractionMethod?: string;
	category?: string;
	displayMode?: "currency" | "count";
}

function buildMockProcessedDocuments(): ProcessedDocument[] {
	const today = new Date().toLocaleDateString();
	return [
		{
			id: "mock-1",
			name: "FACTURA_ELECTRONICA_F001-1254.pdf",
			type: "PDF",
			ruc: "20601234567",
			amount: 1540.5,
			status: "processed",
			date: today,
			confidence: 0.99,
			extractionMethod: "ai",
			category: "Gastos",
		},
		{
			id: "mock-2",
			name: "RECIBO_HONORARIOS_E001-56.xml",
			type: "XML",
			ruc: "10456789012",
			amount: 2500.0,
			status: "processed",
			date: today,
			confidence: 1,
			extractionMethod: "xml",
			category: "Ingresos",
		},
	];
}

export function dashboardRecentDocumentsQueryOptions(
	companyId: string,
	limit = 3,
) {
	return queryOptions({
		queryKey: dashboardKeys.recentTransactions(companyId, limit),
		queryFn: async () => {
			const mockDocuments = buildMockProcessedDocuments();

			if (runtimeConfig.mockMode) {
				return mockDocuments;
			}

			try {
				const result = await dashboardApi.getRecentTransactions(
					limit,
					companyId,
				);
				if (!result.ok) throw new Error(result.error);
				const items = result.data;
				const apiDocs = items.map((doc: DashboardRecentTransaction) => {
					const isSummaryMetric = doc.id.startsWith("summary-");
					const rawAmount = Number(doc.totalAmount ?? 0);

					return {
						id: doc.id ?? crypto.randomUUID(),
						name: isSummaryMetric
							? `Estado ${doc.number ?? "sin-numero"}`
							: `Documento ${doc.number ?? "sin-numero"}`,
						type: "PDF",
						ruc: "---",
						amount: rawAmount,
						status: doc.status === "DRAFT" ? "pending" : "processed",
						date: new Date().toLocaleDateString(),
						confidence: isSummaryMetric ? 1 : 0.98,
						extractionMethod: isSummaryMetric ? "metric" : "ai",
						category: isSummaryMetric ? "Resumen" : "Gastos",
						displayMode: isSummaryMetric ? "count" : "currency",
					} satisfies ProcessedDocument;
				});

				return [...mockDocuments, ...apiDocs];
			} catch (error) {
				const status = getHttpStatusCode(error);
				if (!SUPPRESSIBLE_HTTP_STATUSES.has(status ?? -1)) {
					captureDashboardFallbackError(
						error,
						"features/dashboard/dashboardRecentDocumentsQueryOptions",
						companyId,
					);
				}
				return mockDocuments;
			}
		},
		staleTime: 60_000,
	});
}

export function fiscalIndicatorsQueryOptions() {
	return queryOptions({
		queryKey: dashboardKeys.fiscalIndicators(),
		queryFn: (): Promise<DashboardFiscalIndicatorsResponse> =>
			analyticsApi.getFiscalIndicators(),
		staleTime: 60_000,
	});
}
