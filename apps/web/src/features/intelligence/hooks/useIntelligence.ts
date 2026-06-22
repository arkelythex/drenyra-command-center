import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	anomalyDetectionQueryOptions,
	cashflowPredictionQueryOptions,
	complianceCheckQueryOptions,
	documentClassificationQueryOptions,
	supplierIntelligenceQueryOptions,
} from "../api/query-options";
import { EMPTY_METRICS } from "../lib/intelligence-constants";
import type {
	AnomalyDisplayItem,
	CashflowDisplayData,
	ComplianceDisplayItem,
	DashboardMetric,
	DocumentDisplayData,
	SupplierDisplayData,
} from "../types/intelligence.types";

export function useIntelligenceDashboard() {
	const {
		companyContext: { companyId, tenantId },
	} = useActiveCompanyContext();

	const hasCompany = !!companyId;
	const baseContext = {
		tenantId: tenantId ?? "",
		companyId: companyId ?? "",
		ruc: "",
	};

	// Run all 5 pillar queries in parallel
	const anomalyQuery = useQuery({
		...anomalyDetectionQueryOptions({
			companyId: companyId ?? "",
			context: baseContext,
			igvInvoices: [],
			duplicateChecks: [],
		}),
		enabled: hasCompany,
	});

	const cashflowQuery = useQuery({
		...cashflowPredictionQueryOptions({
			companyId: companyId ?? "",
			context: baseContext,
			transactions: [],
		}),
		enabled: hasCompany,
	});

	const complianceQuery = useQuery({
		...complianceCheckQueryOptions({
			companyId: companyId ?? "",
			context: baseContext,
			obligations: [],
		}),
		enabled: hasCompany,
	});

	const supplierQuery = useQuery({
		...supplierIntelligenceQueryOptions({
			companyId: companyId ?? "",
			context: baseContext,
			suppliers: [],
			transactions: [],
		}),
		enabled: hasCompany,
	});

	const documentQuery = useQuery({
		...documentClassificationQueryOptions({
			companyId: companyId ?? "",
			context: baseContext,
			documents: [],
		}),
		enabled: hasCompany,
	});

	const isLoading =
		anomalyQuery.isLoading ||
		cashflowQuery.isLoading ||
		complianceQuery.isLoading ||
		supplierQuery.isLoading ||
		documentQuery.isLoading;

	const metrics = useMemo<DashboardMetric[]>(() => {
		if (!hasCompany) return EMPTY_METRICS;

		const anomalies = anomalyQuery.data?.anomalies ?? [];
		const cashflow = cashflowQuery.data;
		const obligations = complianceQuery.data?.obligations ?? [];

		return [
			{
				id: "total-anomalies",
				label: "Anomalías Detectadas",
				value: anomalies.length,
				icon: "AlertTriangle",
				color:
					anomalies.length > 5
						? "danger"
						: anomalies.length > 0
							? "warning"
							: "success",
				trend: anomalies.length > 0 ? "up" : "neutral",
				trendValue:
					anomalies.length > 0
						? `${anomalies.filter((a) => a.severity === "critical" || a.severity === "high").length} críticas`
						: "Sin novedades",
			},
			{
				id: "cashflow-projection",
				label: "Flujo de Caja Proyectado",
				value:
					cashflow?.predictedNext30 != null
						? new Intl.NumberFormat("es-PE", {
								style: "currency",
								currency: "PEN",
								minimumFractionDigits: 0,
							}).format(cashflow.predictedNext30)
						: "—",
				icon: "TrendingUp",
				color: (cashflow?.predictedNext30 ?? 0) < 0 ? "danger" : "primary",
				trend:
					cashflow?.trend === "positive"
						? "up"
						: cashflow?.trend === "negative"
							? "down"
							: "neutral",
			},
			{
				id: "compliance-pending",
				label: "Obligaciones Pendientes",
				value: obligations.filter(
					(o) => o.status === "pending" || o.status === "overdue",
				).length,
				icon: "CalendarClock",
				color: obligations.some((o) => o.status === "overdue")
					? "danger"
					: obligations.length > 0
						? "warning"
						: "success",
				trend: "neutral",
				trendValue: `${obligations.filter((o) => o.status === "overdue").length} vencidas`,
			},
			{
				id: "suppliers-at-risk",
				label: "Proveedores en Riesgo",
				value: supplierQuery.data?.atRiskSuppliers ?? 0,
				icon: "Users",
				color:
					(supplierQuery.data?.atRiskSuppliers ?? 0) > 0
						? "warning"
						: "success",
				trend: "neutral",
			},
		];
	}, [
		anomalyQuery.data,
		cashflowQuery.data,
		complianceQuery.data,
		supplierQuery.data,
		hasCompany,
	]);

	const anomalies = useMemo<AnomalyDisplayItem[]>(() => {
		return anomalyQuery.data?.anomalies ?? [];
	}, [anomalyQuery.data]);

	const cashflow = useMemo<CashflowDisplayData | null>(() => {
		return cashflowQuery.data?.cashflow ?? null;
	}, [cashflowQuery.data]);

	const obligations = useMemo<ComplianceDisplayItem[]>(() => {
		return complianceQuery.data?.obligations ?? [];
	}, [complianceQuery.data]);

	const supplier = useMemo<SupplierDisplayData | null>(() => {
		return supplierQuery.data?.supplier ?? null;
	}, [supplierQuery.data]);

	const documents = useMemo<DocumentDisplayData | null>(() => {
		return documentQuery.data?.documents ?? null;
	}, [documentQuery.data]);

	return {
		isLoading,
		isError:
			anomalyQuery.isError ||
			cashflowQuery.isError ||
			complianceQuery.isError ||
			supplierQuery.isError ||
			documentQuery.isError,
		metrics,
		anomalies,
		cashflow,
		obligations,
		supplier,
		documents,
		lastUpdated: new Date().toISOString(),
		refetch: async () => {
			await Promise.all([
				anomalyQuery.refetch(),
				cashflowQuery.refetch(),
				complianceQuery.refetch(),
				supplierQuery.refetch(),
				documentQuery.refetch(),
			]);
		},
	};
}
