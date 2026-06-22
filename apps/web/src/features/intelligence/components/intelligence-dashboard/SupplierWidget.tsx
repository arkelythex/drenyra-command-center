import { Building2, TrendingDown, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPct, formatPEN } from "../../lib/intelligence-utils";
import type { SupplierDisplayData } from "../../types/intelligence.types";

interface SupplierWidgetProps {
	data: SupplierDisplayData | null;
	isLoading: boolean;
}

const AGING_COLORS = [
	"var(--color-success)",
	"var(--color-warning)",
	"var(--color-danger)",
	"var(--color-danger)",
];

export function SupplierWidget({ data, isLoading }: SupplierWidgetProps) {
	if (isLoading) return <SupplierWidgetSkeleton />;

	if (!data) {
		return (
			<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
				<EmptyState />
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-[var(--color-info)]/10">
						<Users className="w-5 h-5 text-[var(--color-info)]" />
					</div>
					<div>
						<h3 className="n font-semibold tracking-tight text-foreground">
							Inteligencia de Proveedores
						</h3>
						<p className="text-xs text-[var(--text-secondary)]">
							{data.totalSuppliers} proveedores · {data.atRiskSuppliers} en
							riesgo
						</p>
					</div>
				</div>
			</div>

			{/* Concentration + Payment Delay */}
			<div className="grid grid-cols-2 gap-4 mb-5">
				<div className="p-3 rounded-lg bg-[var(--surface-2)]/50">
					<div className="flex items-center gap-2 mb-1">
						<Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
						<p className="text-xs text-[var(--text-muted)]">
							Concentración Top 1
						</p>
					</div>
					<p
						className={`font-mono text-lg font-semibold tabular-nums tracking-tight ${data.topSupplierConcentration > 30 ? "text-[var(--color-danger)]" : data.topSupplierConcentration > 20 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
					>
						{formatPct(data.topSupplierConcentration)}
					</p>
				</div>
				<div className="p-3 rounded-lg bg-[var(--surface-2)]/50">
					<div className="flex items-center gap-2 mb-1">
						<TrendingDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
						<p className="text-xs text-[var(--text-muted)]">Demora Promedio</p>
					</div>
					<p
						className={`font-mono text-lg font-semibold tabular-nums tracking-tight ${data.averagePaymentDelay > 30 ? "text-[var(--color-danger)]" : data.averagePaymentDelay > 15 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
					>
						{data.averagePaymentDelay > 0
							? `${data.averagePaymentDelay} días`
							: "Al día"}
					</p>
				</div>
			</div>

			{/* Aging pie chart */}
			{data.agingBreakdown.length > 0 && (
				<div className="mt-2">
					<p className="text-xs font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide">
						Antigüedad de Deuda
					</p>
					<div className="flex items-center gap-4">
						<div className="w-24 h-24 shrink-0">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data.agingBreakdown}
										cx="50%"
										cy="50%"
										innerRadius={22}
										outerRadius={38}
										dataKey="amount"
										nameKey="range"
									>
										{data.agingBreakdown.map((entry, idx) => (
											<Cell
												key={entry.range}
												fill={AGING_COLORS[idx % AGING_COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: "var(--surface-1)",
											border: "1px solid var(--border-subtle)",
											borderRadius: "8px",
											fontSize: "12px",
										}}
										formatter={(value: number) => [formatPEN(value), "Monto"]}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="flex-1 space-y-1.5">
							{data.agingBreakdown.map((entry, idx) => (
								<div
									key={entry.range}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<span
											className="w-2 h-2 rounded-full"
											style={{
												backgroundColor:
													AGING_COLORS[idx % AGING_COLORS.length],
											}}
										/>
										<span className="text-xs text-[var(--text-secondary)]">
											{entry.range}
										</span>
									</div>
									<span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">
										{formatPct(entry.percentage)}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Top suppliers */}
			{data.topSuppliers.length > 0 && (
				<div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
					<p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
						Top Proveedores
					</p>
					{data.topSuppliers.slice(0, 3).map((s, idx) => (
						<div
							key={s.name}
							className="flex items-center justify-between py-1"
						>
							<div className="flex items-center gap-2">
								<span className="text-xs text-[var(--text-muted)] w-4">
									{idx + 1}.
								</span>
								<span className="text-xs text-[var(--text-primary)] truncate max-w-[140px]">
									{s.name}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-1.5 w-16 bg-[var(--surface-2)] rounded-full overflow-hidden">
									<div
										className="h-full rounded-full bg-[var(--color-info)]"
										style={{ width: `${s.percentage}%` }}
									/>
								</div>
								<span className="text-xs text-[var(--text-muted)] tabular-nums w-10 text-right">
									{formatPct(s.percentage)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function EmptyState() {
	return (
		<>
			<div className="flex items-center gap-3 mb-5">
				<div className="p-2 rounded-lg bg-[var(--color-info)]/10">
					<Users className="w-5 h-5 text-[var(--color-info)]" />
				</div>
				<div>
					<h3 className="n font-semibold tracking-tight text-foreground">
						Inteligencia de Proveedores
					</h3>
				</div>
			</div>
			<div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
				<Users className="w-8 h-8 mb-2 opacity-50" />
				<p className="text-sm">Carga datos de proveedores para ver análisis</p>
			</div>
		</>
	);
}

function SupplierWidgetSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-5">
				<div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
				<div className="space-y-1.5">
					<div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
					<div className="h-3 w-32 bg-[var(--surface-2)] rounded" />
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4 mb-5">
				<div className="h-16 bg-[var(--surface-2)] rounded-lg" />
				<div className="h-16 bg-[var(--surface-2)] rounded-lg" />
			</div>
			<div className="h-24 bg-[var(--surface-2)] rounded-lg" />
		</div>
	);
}
