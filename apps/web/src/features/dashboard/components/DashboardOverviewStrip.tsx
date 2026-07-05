import { ExternalLink, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import type { FC } from "react";
import { AnimatedNumber } from "@/components/ui/motion-primitives";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { formatPEN } from "@/lib/utils";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatDashboardFreshness } from "../lib/dashboard-freshness";

function parseAmount(amount: string): number {
	const parsed = Number(amount);
	return Number.isFinite(parsed) ? parsed : 0;
}

export const DashboardOverviewStrip: FC = () => {
	const { financials, health, lastUpdatedAt } = useDashboardData();
	const { companyContext } = useActiveCompanyContext();
	const revenueValue = parseAmount(financials.revenue);
	const outstandingValue = parseAmount(financials.outstanding);
	const complianceValue = Number(health.complianceScore);
	const freshnessLabel = formatDashboardFreshness(lastUpdatedAt);

	const stats = [
		{
			id: "monthly-revenue",
			label: "Ingresos del periodo",
			value: revenueValue,
			formatter: (v: number) => formatPEN(v, 0),
			icon: TrendingUp,
			status: "active",
		},
		{
			id: "compliance-score",
			label: "Salud Fiscal",
			value: complianceValue,
			formatter: (v: number) => `${Math.round(v)}%`,
			icon: ShieldCheck,
			status: complianceValue >= 85 ? "success" : "warning",
		},
		{
			id: "outstanding-amount",
			label: "Cobros Pendientes",
			value: outstandingValue,
			formatter: (v: number) => formatPEN(v, 0),
			icon: Wallet,
			status: "active",
		},
	] as const;

	return (
		<section aria-label="Radar Operativo" className="space-y-8">
			<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-1">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
						<h2 className="text-xl font-bold tracking-tight text-primary">
							Radar Operativo
						</h2>
					</div>
					<p className="text-xs font-medium text-secondary/40 uppercase tracking-widest">
						{companyContext.companyName} · RUC {companyContext.ruc}
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs font-bold text-secondary flex items-center gap-2">
						<div className="h-1.5 w-1.5 rounded-full bg-success" />
						Live Sync: {freshnessLabel}
					</div>
					<button
						aria-label="Abrir enlace externo"
						className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-secondary"
					>
						<ExternalLink size={14} />
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{stats.map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.id}
							className="group p-5 rounded-[1.5rem] border border-gray-100 bg-white hover:border-info-subtle transition-all duration-300"
						>
							<div className="flex items-center justify-between mb-4">
								<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
									{item.label}
								</span>
								<Icon
									size={16}
									className="text-secondary/20 group-hover:text-info transition-colors"
								/>
							</div>

							<div className="space-y-1">
								<AnimatedNumber
									value={item.value}
									formatter={item.formatter}
									className="block text-2xl font-bold tracking-tight text-primary tabular-nums font-mono"
								/>
								<div className="flex items-center gap-1.5">
									<div className="h-1 flex-1 bg-gray-50 rounded-full overflow-hidden">
										<div className="h-full bg-info rounded-full w-[65%]" />
									</div>
									<span className="text-xs font-bold text-secondary/40">
										65% Target
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};
