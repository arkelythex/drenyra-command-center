"use client";

import { cn, n } from "@/lib/utils";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { useAccountingStore, type KpiMetric } from "@/stores/accounting-store";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	DollarSign,
	Percent,
	CalendarDays,
	Hash,
} from "lucide-react";

const FORMAT_ICONS = {
	currency: DollarSign,
	percentage: Percent,
	number: Hash,
	days: CalendarDays,
} as const;

function formatKpiValue(value: number, format: KpiMetric["format"]): string {
	switch (format) {
		case "currency":
			return n(value);
		case "percentage":
			return `${value.toFixed(1)}%`;
		case "days":
			return `${value} días`;
		case "number":
			return value.toFixed(2);
	}
}

function KpiCard({ metric }: { metric: KpiMetric }) {
	const Icon = FORMAT_ICONS[metric.format];
	const TrendIcon =
		metric.trend === "up"
			? TrendingUp
			: metric.trend === "down"
				? TrendingDown
				: Minus;
	const trendColor =
		metric.trend === "up"
			? "text-[var(--color-success)]"
			: metric.trend === "down"
				? "text-[var(--color-danger)]"
				: "text-[var(--text-muted)]";

	return (
		<div className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm">
			<div className="flex items-center justify-between mb-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)]">
					<Icon size={14} className="text-[var(--text-muted)]" />
				</div>
				<div
					className={cn(
						"flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium",
						trendColor,
					)}
				>
					<TrendIcon size={11} />
					<span>
						{metric.variance > 0 ? "+" : ""}
						{metric.variance.toFixed(1)}%
					</span>
				</div>
			</div>
			<p className="text-2xs text-[var(--text-muted)] mb-1">{metric.label}</p>
			<p className="font-mono text-lg font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
				{formatKpiValue(metric.value, metric.format)}
			</p>
			<p className="text-2xs text-[var(--text-muted)] mt-1">
				vs. {formatKpiValue(metric.previousValue, metric.format)}
			</p>
		</div>
	);
}

export function KpiDashboard() {
	const { companyContext, fiscalPeriod, formatFiscalPeriodLabel } =
		useActiveCompanyContext();
	const kpiMetrics = useAccountingStore((s) => s.kpiMetrics);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b border-[var(--border-subtle)] px-4 py-3">
				<h3 className="text-sm font-semibold text-[var(--text-primary)]">
					KPIs Financieros
				</h3>
				<p className="text-2xs text-[var(--text-muted)] mt-0.5">
					{companyContext.companyName} ·{" "}
					{fiscalPeriod
						? formatFiscalPeriodLabel(fiscalPeriod)
						: "Período actual"}
				</p>
			</div>

			{/* KPI Grid */}
			<div className="flex-1 overflow-y-auto p-3">
				<div className="grid grid-cols-2 gap-3">
					{kpiMetrics.map((metric) => (
						<KpiCard key={metric.id} metric={metric} />
					))}
				</div>
			</div>

			{/* Summary footer */}
			<div className="border-t border-[var(--border-subtle)] px-4 py-2">
				<div className="flex items-center gap-2 text-2xs text-[var(--text-muted)]">
					<TrendingUp size={11} className="text-[var(--color-success)]" />
					<span>Mejora vs período anterior</span>
					<TrendingDown size={11} className="ml-2 text-[var(--color-danger)]" />
					<span>Deterioro vs período anterior</span>
				</div>
			</div>
		</div>
	);
}
