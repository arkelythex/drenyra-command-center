import { Calculator, Download, Menu, TrendingDown } from "lucide-react";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { n } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { DEFAULT_SCENARIO_A, DEFAULT_SCENARIO_B } from "./CompareLoansView.data";
import type {
	LoanCalculationResult,
	PeruLoanScenario,
} from "./CompareLoansView.types";
import { LoanInputCard } from "./components/LoanInputCard";

const LoanComparisonChart = React.lazy(() =>
	import("../LoanComparisonChart").then((m) => ({
		default: m.LoanComparisonChart,
	})),
);

const calculatePeruLoan = (loan: PeruLoanScenario): LoanCalculationResult => {
	const tem = (1 + loan.tea / 100) ** (1 / 12) - 1;
	const n_ = loan.termYears * 12;
	const cuotaBase =
		(loan.amount * (tem * (1 + tem) ** n_)) / ((1 + tem) ** n_ - 1);
	const desgravamenFirstMonth = loan.amount * (loan.desgravamenRate / 100);
	const riskInsurance = loan.propertyValue * (loan.riskInsuranceRate / 100);
	const cuotaTotalMensual = cuotaBase + desgravamenFirstMonth + riskInsurance;
	return {
		cuotaBase,
		desgravamenFirstMonth,
		riskInsurance,
		cuotaTotalMensual,
		totalIntereses: cuotaBase * n_ - loan.amount,
	};
};

export const CompareLoansView = () => {
	const [scenarioA, setScenarioA] =
		useState<PeruLoanScenario>(DEFAULT_SCENARIO_A);
	const { setIsMobileOpen } = useSidebarLayout();
	const [scenarioB, setScenarioB] =
		useState<PeruLoanScenario>(DEFAULT_SCENARIO_B);
	const [isChartReady, setIsChartReady] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		if ("requestIdleCallback" in window) {
			const idleId = window.requestIdleCallback(() => setIsChartReady(true), {
				timeout: 250,
			});
			return () => window.cancelIdleCallback(idleId);
		}

		const timeoutId = globalThis.setTimeout(() => setIsChartReady(true), 120);
		return () => globalThis.clearTimeout(timeoutId);
	}, []);

	const resultsA = useMemo(() => calculatePeruLoan(scenarioA), [scenarioA]);
	const resultsB = useMemo(() => calculatePeruLoan(scenarioB), [scenarioB]);

	const comparisonData = [
		{
			name: "Cuota Mensual",
			"Escenario A": resultsA.cuotaTotalMensual,
			"Escenario B": resultsB.cuotaTotalMensual,
		},
		{
			name: "Intereses Totales",
			"Escenario A": resultsA.totalIntereses,
			"Escenario B": resultsB.totalIntereses,
		},
	];

	const formatMoney = n;

	return (
		<div className="flex flex-col h-full bg-background overflow-hidden font-sans text-foreground">
			{/* Header - CommandDeck Style */}
			<header className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border bg-background flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 z-50 shadow-sm relative overflow-hidden">
				{/* Ambient Glow */}
				<div className="absolute inset-0 bg-gradient-to-r from-[var(--premium-action-cyan)] via-transparent to-[var(--premium-action-blue)] pointer-events-none" />

				<div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
					<Button
						onClick={() => setIsMobileOpen(true)}
						variant="outline"
						size="icon"
						aria-label="Menú"
						className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
					>
						<Menu className="h-4 w-4 text-muted-foreground" />
					</Button>
					<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)] flex items-center justify-center border border-[rgba(var(--premium-info-rgb),0.20)] shadow-lg shadow-[0_0_24px_rgba(var(--premium-info-rgb),0.20)]">
						<Calculator
							size={20}
							className="text-[var(--premium-action-cyan)] sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100 transition-opacity"
							strokeWidth={1.5}
						/>
					</div>
					<div className="flex-1 min-w-0">
						<h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground leading-none truncate">
							Simulador de Créditos
						</h1>
						<div className="flex items-center gap-3 mt-1 sm:mt-1.5">
							<div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[rgba(var(--premium-info-rgb),0.05)] border border-[rgba(var(--premium-info-rgb),0.10)] sm:bg-[rgba(var(--premium-info-rgb),0.10)] sm:border-[rgba(var(--premium-info-rgb),0.20)]">
								<span className="text-2xs sm:text-xs font-black text-[var(--premium-action-cyan)] dark:text-[var(--premium-action-cyan)] uppercase tracking-widest leading-none">
									MODELADO FINANCIERO SBS
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-row items-center gap-2 sm:gap-4 w-full md:w-auto relative z-10 justify-end">
					<Button className="h-9 flex-shrink-0 rounded-lg bg-foreground px-4 text-xs font-black uppercase tracking-widest text-background shadow-lg transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:bg-foreground/90 hover:shadow-xl sm:h-10 sm:rounded-xl sm:px-6 sm:text-label">
						<Download size={14} strokeWidth={3} className="sm:mr-2" />{" "}
						<span className="hidden sm:inline">EXPORTAR CORRIDA</span>
					</Button>
				</div>
			</header>

			<div className="custom-scrollbar flex-1 animate-entrance overflow-y-auto bg-background p-10 pb-32 lg:p-16">
				<div className="max-w-7xl mx-auto space-y-12">
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
						<LoanInputCard
							label="Escenario A (Líder)"
							scenario={scenarioA}
							results={resultsA}
							setScenario={setScenarioA}
							highlight
						/>
						<LoanInputCard
							label="Escenario B (Alternativa)"
							scenario={scenarioB}
							results={resultsB}
							setScenario={setScenarioB}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
						<Card className="lg:col-span-8 shadow-xl">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<TrendingDown size={16} /> Comparativa de Impacto
								</CardTitle>
							</CardHeader>
							<CardContent className="h-80 pt-6">
								{isChartReady ? (
									<Suspense fallback={<ChartSkeleton className="h-full" />}>
										<LoanComparisonChart
											comparisonData={comparisonData}
											formatMoney={formatMoney}
										/>
									</Suspense>
								) : (
									<ChartSkeleton className="h-full" />
								)}
							</CardContent>
						</Card>

						<div className="lg:col-span-4 flex flex-col gap-6">
							<div className="flex flex-1 flex-col justify-center rounded-2xl bg-foreground p-10 text-background shadow-xl">
								<p className="text-label font-black uppercase tracking-[0.3em] opacity-60 mb-4 text-center">
									Ahorro Mensual Detectado
								</p>
								<p className="text-5xl font-black font-mono tracking-tighter text-center tabular-nums italic">
									{formatMoney(
										Math.abs(
											resultsA.cuotaTotalMensual - resultsB.cuotaTotalMensual,
										),
									)}
								</p>
								<div className="mt-10 pt-10 border-t border-background/20 space-y-2">
									<p className="text-label font-black uppercase text-center opacity-40">
										Diferencia Total en Intereses
									</p>
									<p className="text-xl font-black font-mono text-center">
										{formatMoney(
											Math.abs(
												resultsA.totalIntereses - resultsB.totalIntereses,
											),
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
