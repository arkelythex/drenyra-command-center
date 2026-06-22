import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { getHttpStatusCode } from "@/lib/http-client";
import { captureError } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";
import { formatPEN } from "@/lib/utils";
import { dashboardApi } from "../../api/dashboard.api";
import { ExpensesDistributionCard } from "./expenses/ExpensesDistributionCard";
import { ExpensesMetricCard } from "./expenses/ExpensesMetricCard";
import { ExpensesTopVendorsCard } from "./expenses/ExpensesTopVendorsCard";
import {
	EXPENSES_FALLBACK,
	SUPPRESSIBLE_HTTP_STATUSES,
} from "./expenses/expenses-tab.constants";
import type { ExpensesQueryResult } from "./expenses/expenses-tab.types";
import { dashboardKeys } from "../../dashboard.query-keys";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

export const ExpensesTab: React.FC = () => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	const { data } = useQuery({
		queryKey: dashboardKeys.expenses(companyId),
		queryFn: async (): Promise<ExpensesQueryResult> => {
			if (runtimeConfig.mockMode) {
				return { payload: EXPENSES_FALLBACK, source: "mock" };
			}

			try {
				const result = await dashboardApi.getExpenses(companyId);
				if (!result.ok) throw new Error(result.error);
				return { payload: result.data, source: "live" };
			} catch (error) {
				const status = getHttpStatusCode(error);
				if (!SUPPRESSIBLE_HTTP_STATUSES.has(status ?? -1)) {
					captureError(
						error instanceof Error
							? error
							: new Error("Expenses dashboard unavailable"),
						{
							companyId,
							source: "features/dashboard/ExpensesTab.queryFn",
							status: status ?? null,
						},
					);
				}
				return { payload: EXPENSES_FALLBACK, source: "fallback" };
			}
		},
		staleTime: 60_000,
	});

	const expenses = data?.payload ?? EXPENSES_FALLBACK;
	const dataSource = data?.source ?? "fallback";
	const topCategories = expenses.expenseByCategory.slice(0, 5);
	const topVendors = expenses.topVendors.slice(0, 6);

	const averageCategoryExpense =
		topCategories.length > 0
			? topCategories.reduce((sum, item) => sum + item.total, 0) /
				topCategories.length
			: 0;

	const topCategory = topCategories[0];

	return (
		<section aria-label="Análisis de gastos" className="space-y-6 pb-20">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						Gastos
					</h2>
					<p className="text-sm text-muted-foreground">
						Control de ejecución presupuestal y riesgo de proveedores.
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

			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<ExpensesMetricCard
					title="Ejecución presupuestal"
					value={formatPEN(expenses.budgetExecution.totalExpenses)}
					hint={`${expenses.budgetExecution.billCount} comprobantes registrados`}
					icon={Wallet}
				/>
				<ExpensesMetricCard
					title="IGV de compras"
					value={formatPEN(expenses.budgetExecution.totalIgv)}
					hint="Crédito fiscal acumulado"
					icon={ReceiptText}
				/>
				<ExpensesMetricCard
					title="Cumplimiento de pago"
					value={`${expenses.paymentCompliance.toFixed(1)}%`}
					hint="Facturas pagadas dentro de plazo"
					icon={ShieldCheck}
				/>
				<ExpensesMetricCard
					title="Categorías activas"
					value={`${expenses.expenseByCategory.length}`}
					hint="Concentración por tipo de gasto"
					icon={BarChart3}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
				<ExpensesDistributionCard
					topCategories={topCategories}
					averageCategoryExpense={averageCategoryExpense}
					topCategory={topCategory}
				/>
				<ExpensesTopVendorsCard
					topVendors={topVendors}
					totalExpenses={expenses.budgetExecution.totalExpenses}
				/>
			</div>
		</section>
	);
};
