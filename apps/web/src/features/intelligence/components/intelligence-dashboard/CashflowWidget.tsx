import { BarChart3, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatConfidence, formatPEN } from "../../lib/intelligence-utils";
import type { CashflowDisplayData } from "../../types/intelligence.types";

interface CashflowWidgetProps {
	data: CashflowDisplayData | null;
	isLoading: boolean;
}

export function CashflowWidget({ data, isLoading }: CashflowWidgetProps) {
	if (isLoading) return <CashflowWidgetSkeleton />;

	if (!data) {
		return (
			<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
				<EmptyState />
			</div>
		);
	}

	const trendIcon =
		data.trend === "positive"
			? TrendingUp
			: data.trend === "negative"
				? TrendingDown
				: Minus;
	const TrendIcon = trendIcon;
	const trendColor =
		data.trend === "positive"
			? "text-[var(--color-success)]"
			: data.trend === "negative"
				? "text-[var(--color-danger)]"
				: "text-[var(--text-muted)]";

	// Merge historical + forecast for display
	const chartData = [
		...(data.historicalData?.slice(-30).map((d) => ({
			...d,
			forecast: null,
			confidenceLower: null,
			confidenceUpper: null,
		})) ?? []),
		...(data.forecastData
			?.slice(0, 30)
			.map((d) => ({ ...d, historical: null })) ?? []),
	];

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
						<BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
					</div>
					<div>
						<h3 className="n font-semibold tracking-tight text-foreground">
							Predicción de Flujo de Caja
						</h3>
						<p className="text-xs text-[var(--text-secondary)]">
							Confianza: {formatConfidence(data.confidence)} · Tendencia:
							<span className={`ml-1 ${trendColor}`}>
								{data.trend === "positive"
									? "Positiva"
									: data.trend === "negative"
										? "Negativa"
										: "Estable"}
							</span>
							<TrendIcon className={`w-3 h-3 inline ml-0.5 ${trendColor}`} />
						</p>
					</div>
				</div>
			</div>

			{/* Summary metrics */}
			<div className="grid grid-cols-3 gap-4 mb-5">
				<Metric
					label="Balance Actual"
					value={data.currentBalance}
					color="var(--text-primary)"
				/>
				<Metric
					label="Proy. 30 días"
					value={data.predictedNext30}
					color="var(--color-primary)"
				/>
				<Metric
					label="Proy. 90 días"
					value={data.predictedNext90}
					color={
						data.predictedNext90 >= 0
							? "var(--color-success)"
							: "var(--color-danger)"
					}
				/>
			</div>

			{/* Chart */}
			{chartData.length > 0 && (
				<div className="h-48">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={chartData}>
							<defs>
								<linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-primary)"
										stopOpacity={0.15}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-primary)"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="var(--border-subtle)"
							/>
							<XAxis
								dataKey="date"
								tick={{ fontSize: 10, fill: "var(--text-muted)" }}
								tickFormatter={(v) => {
									try {
										return new Date(v).toLocaleDateString("es-PE", {
											day: "numeric",
											month: "short",
										});
									} catch {
										return v;
									}
								}}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 10, fill: "var(--text-muted)" }}
								tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
								axisLine={false}
								tickLine={false}
							/>
							<Tooltip
								contentStyle={{
									background: "var(--surface-1)",
									border: "1px solid var(--border-subtle)",
									borderRadius: "8px",
									fontSize: "12px",
								}}
								formatter={(value: number) => [formatPEN(value), "Monto"]}
							/>
							<Area
								type="monotone"
								dataKey="historical"
								stroke="var(--color-primary)"
								fill="url(#historicalGrad)"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="forecast"
								stroke="var(--color-warning)"
								strokeWidth={2}
								strokeDasharray="6 3"
								dot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			)}

			{/* Confidence interval legend */}
			<div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border-subtle)]">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-0.5 rounded bg-[var(--color-primary)]" />
					<span className="text-xs text-[var(--text-muted)]">Histórico</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="w-3 h-0.5 rounded bg-[var(--color-warning)] border-dashed"
						style={{ borderTop: "2px dashed var(--color-warning)", height: 0 }}
					/>
					<span className="text-xs text-[var(--text-muted)]">Proyección</span>
				</div>
			</div>
		</div>
	);
}

function Metric({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: string;
}) {
	return (
		<div className="text-center">
			<p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
			<p
				className="font-mono text-lg font-semibold tabular-nums tracking-tight"
				style={{ color }}
			>
				{formatPEN(value)}
			</p>
		</div>
	);
}

function EmptyState() {
	return (
		<>
			<div className="flex items-center gap-3 mb-5">
				<div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
					<BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
				</div>
				<div>
					<h3 className="n font-semibold tracking-tight text-foreground">
						Predicción de Flujo de Caja
					</h3>
				</div>
			</div>
			<div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
				<BarChart3 className="w-8 h-8 mb-2 opacity-50" />
				<p className="text-sm">
					Carga datos de transacciones para ver predicciones
				</p>
			</div>
		</>
	);
}

function CashflowWidgetSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-5">
				<div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
				<div className="space-y-1.5">
					<div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
					<div className="h-3 w-36 bg-[var(--surface-2)] rounded" />
				</div>
			</div>
			<div className="grid grid-cols-3 gap-4 mb-5">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="h-12 bg-[var(--surface-2)] rounded" />
				))}
			</div>
			<div className="h-48 bg-[var(--surface-2)] rounded-lg" />
		</div>
	);
}
