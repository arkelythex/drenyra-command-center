import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { getHttpStatusCode } from "@/lib/http-client";
import { captureError } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { dashboardApi } from "../../api/dashboard.api";
import { dashboardKeys } from "../../dashboard.query-keys";
import {
	INCOME_FALLBACK,
	SUPPRESSIBLE_HTTP_STATUSES,
} from "./income-tab/constants";
import { IncomeKpiGrid } from "./income-tab/IncomeKpiGrid";
import { IncomeTrendCard } from "./income-tab/IncomeTrendCard";
import { TopCustomersCard } from "./income-tab/TopCustomersCard";
import type { IncomeQueryResult } from "./income-tab/types";
import {
	enrichIncomeTrend,
	getAverageBilling,
	getPeakPeriod,
} from "./income-tab/utils";

export const IncomeTab: React.FC = () => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	const { data } = useQuery({
		queryKey: dashboardKeys.income(companyId),
		queryFn: async (): Promise<IncomeQueryResult> => {
			if (runtimeConfig.mockMode) {
				return { payload: INCOME_FALLBACK, source: "mock" };
			}

			try {
				const result = await dashboardApi.getIncome(companyId);
				if (!result.ok) throw new Error(result.error);
				return { payload: result.data, source: "live" };
			} catch (error) {
				const status = getHttpStatusCode(error);
				if (!SUPPRESSIBLE_HTTP_STATUSES.has(status ?? -1)) {
					captureError(
						error instanceof Error
							? error
							: new Error("Income dashboard unavailable"),
						{
							companyId,
							source: "features/dashboard/IncomeTab.queryFn",
							status: status ?? null,
						},
					);
				}
				return { payload: INCOME_FALLBACK, source: "fallback" };
			}
		},
		staleTime: 60_000,
	});

	const income = data?.payload ?? INCOME_FALLBACK;
	const dataSource = data?.source ?? "fallback";
	const topCustomers = income.topCustomers.slice(0, 6);
	const trendData = enrichIncomeTrend(income.billingEvolution.slice(-12));
	const averageBilling = getAverageBilling(trendData);
	const latestPoint = trendData[trendData.length - 1];
	const peakPeriod = getPeakPeriod(trendData);

	return (
		<section aria-label="Análisis de ingresos" className="space-y-6 pb-20">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						Ingresos
					</h2>
					<p className="text-sm text-muted-foreground">
						Seguimiento de facturación, cobranza y clientes clave.
					</p>
				</div>
				<p
					className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${
						dataSource === "live"
							? "border-success-subtle bg-success-subtle text-success"
							: "border-warning-subtle bg-warning-subtle text-warning"
					}`}
				>
					{dataSource === "live" ? "Datos en línea" : "Datos de contingencia"}
				</p>
			</div>

			<IncomeKpiGrid income={income} />

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
				<IncomeTrendCard
					trendData={trendData}
					averageBilling={averageBilling}
					latestPoint={latestPoint}
					peakPeriod={peakPeriod}
				/>
				<TopCustomersCard
					topCustomers={topCustomers}
					totalBilled={income.totalBilled}
				/>
			</div>
		</section>
	);
};
