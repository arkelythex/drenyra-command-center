import {
	ArrowDownRight,
	ArrowUpRight,
	Calendar,
	Target,
	TrendingUp,
	Waves,
} from "lucide-react";
import { useState } from "react";
import { Text } from "@/components/atoms/text";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import {
	type LiquidityPoint,
	MOCK_DATA,
	PEN_COMPACT_FORMATTER,
	PEN_FORMATTER,
	PERCENT_FORMATTER,
} from "./liquidity/liquidity-chart.constants";
import { KPICard, SummaryCard } from "./liquidity/liquidity-chart-cards";
import { ActiveDetailPanel } from "./liquidity/liquidity-chart-detail";
import {
	buildAreaPath,
	buildPath,
	CHART_PADDING_X,
	CHART_PADDING_Y,
	CHART_WIDTH,
} from "./liquidity/liquidity-chart-path";
import { LiquidityChartSvg } from "./liquidity/liquidity-chart-svg";

export const LiquidityChart = () => {
	const [activeIndex, setActiveIndex] = useState(MOCK_DATA.length - 1);

	const chartData: LiquidityPoint[] = MOCK_DATA.map((item) => {
		const delta = item.cash - item.projected;
		const deltaPct = item.projected > 0 ? (delta / item.projected) * 100 : 0;

		return {
			month: item.month,
			cash: item.cash,
			projected: item.projected,
			delta,
			deltaPct,
		};
	});

	const latestPoint = chartData[chartData.length - 1];
	const currentLiquidity = latestPoint?.cash ?? 0;
	const projectedLiquidity = latestPoint?.projected ?? 0;
	const variance = currentLiquidity - projectedLiquidity;
	const variancePercent =
		projectedLiquidity > 0 ? (variance / projectedLiquidity) * 100 : 0;

	const averageReal =
		chartData.length > 0
			? chartData.reduce((sum, point) => sum + point.cash, 0) / chartData.length
			: 0;

	const hitRate =
		chartData.length > 0
			? (chartData.filter((point) => Math.abs(point.deltaPct) <= 5).length /
					chartData.length) *
				100
			: 0;

	const peakPoint = chartData.reduce<LiquidityPoint | null>((max, current) => {
		if (!max || current.cash > max.cash) return current;
		return max;
	}, null);

	const minValue = Math.min(
		...chartData.map((point) => Math.min(point.cash, point.projected)),
	);
	const maxValue = Math.max(
		...chartData.map((point) => Math.max(point.cash, point.projected)),
	);
	const valueRange = Math.max(maxValue - minValue, 1);
	const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
	const innerHeight = 240 - CHART_PADDING_Y * 2;

	const toPoint = (value: number, index: number) => ({
		x:
			CHART_PADDING_X +
			(index / Math.max(chartData.length - 1, 1)) * innerWidth,
		y: 240 - CHART_PADDING_Y - ((value - minValue) / valueRange) * innerHeight,
	});

	const cashPoints = chartData.map((point, index) =>
		toPoint(point.cash, index),
	);
	const projectedPoints = chartData.map((point, index) =>
		toPoint(point.projected, index),
	);
	const cashPath = buildPath(cashPoints);
	const projectedPath = buildPath(projectedPoints);
	const cashAreaPath = buildAreaPath(cashPoints);
	const activePoint = chartData[activeIndex] ?? latestPoint;
	const activeCashPoint =
		cashPoints[activeIndex] ?? cashPoints[cashPoints.length - 1];

	return (
		<section
			aria-labelledby="liquidity-chart-title"
			className="relative h-full"
		>
			<Card className="flex h-full flex-col gap-6 p-5 lg:p-6">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="ui-card-surface flex h-10 w-10 items-center justify-center rounded-xl text-info">
								<Waves size={18} className="text-info" />
							</div>
							<div className="flex flex-col">
								<Text
									id="liquidity-chart-title"
									variant="hero"
									className="text-2xl font-bold tracking-tight"
								>
									Liquidez de tesorería
								</Text>
								<div className="flex items-center gap-2">
									<Calendar size={12} className="text-muted-foreground" />
									<Text
										variant="label"
										className="text-2xs text-muted-foreground"
									>
										Proyección Q1-Q2 2026
									</Text>
								</div>
							</div>
						</div>

						<div>
							<AnimatedNumber
								value={currentLiquidity}
								formatter={(value) => PEN_FORMATTER.format(value)}
								className="block text-3xl font-semibold tracking-tight text-foreground lg:text-4xl"
							/>
							<Text
								variant="label"
								className="mt-2 block text-muted-foreground"
							>
								Cierre proyectado:{" "}
								<span className="text-foreground/70">
									{PEN_FORMATTER.format(projectedLiquidity)}
								</span>
							</Text>
						</div>
					</div>

					<div
						className={cn(
							"inline-flex items-center gap-3 rounded-lg border px-4 py-3",
							variance >= 0
								? "border-success-subtle bg-success-subtle text-success"
								: "border-danger-subtle bg-danger-subtle text-danger",
						)}
					>
						{variance >= 0 ? (
							<ArrowUpRight size={18} strokeWidth={2.25} />
						) : (
							<ArrowDownRight size={18} strokeWidth={2.25} />
						)}
						<div className="flex flex-col">
							<Text
								variant="data"
								className="text-base font-semibold leading-none text-inherit"
							>
								{variance >= 0 ? "+" : ""}
								{PERCENT_FORMATTER.format(variancePercent)}%
							</Text>
							<Text
								variant="label"
								className="mt-1 block text-2xs text-inherit opacity-70"
							>
								Vs. forecast
							</Text>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
					<KPICard
						label="Promedio mensual"
						value={PEN_COMPACT_FORMATTER.format(averageReal)}
					/>
					<KPICard label="Punto de retorno" value="S/ 2.4M" />
					<KPICard
						label="Precisión estratégica"
						value={`${PERCENT_FORMATTER.format(hitRate)}%`}
						icon={<Target size={14} />}
					/>
					<KPICard
						label="Estado IA"
						value="Proyectando"
						tone="info"
						icon={<TrendingUp size={14} />}
					/>
				</div>

				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
					<div className="ui-card-surface rounded-2xl p-4">
						<div className="mb-4 flex items-center justify-between gap-3">
							<Text
								variant="label"
								className="text-2xs uppercase tracking-[0.14em] text-muted-foreground"
							>
								Flujo real vs. proyectado
							</Text>
							<Text variant="label" className="text-2xs text-muted-foreground">
								{activePoint.month} 2026
							</Text>
						</div>

						<div className="relative overflow-hidden rounded-[1.25rem] border border-border/35 bg-[rgba(2,4,6,0.48)] p-2">
							<LiquidityChartSvg
								chartData={chartData}
								cashPath={cashPath}
								projectedPath={projectedPath}
								cashAreaPath={cashAreaPath}
								activeIndex={activeIndex}
								cashPoints={cashPoints}
								projectedPoints={projectedPoints}
							/>
						</div>

						<div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-12">
							{chartData.map((point, index) => {
								const isActive = index === activeIndex;

								return (
									<button
										key={point.month}
										type="button"
										onMouseEnter={() => setActiveIndex(index)}
										onFocus={() => setActiveIndex(index)}
										onClick={() => setActiveIndex(index)}
										className={cn(
											"rounded-md border px-2 py-1.5 text-center transition-[border-color,background-color,color] duration-150",
											isActive
												? "ui-segmented-control-active"
												: "border-border/35 bg-background/35 text-muted-foreground hover:border-border/55 hover:text-foreground",
										)}
									>
										<span className="block text-2xs font-medium">
											{point.month}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					<ActiveDetailPanel activePoint={activePoint} />
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<SummaryCard
						label="Máximo histórico"
						value={
							peakPoint
								? `${peakPoint.month} · ${PEN_FORMATTER.format(peakPoint.cash)}`
								: "N/A"
						}
						icon={<TrendingUp size={16} />}
					/>
					<SummaryCard
						label="Anomalía detectada"
						value="Desviación en Abr · S/ 14.2K"
						icon={<ArrowDownRight size={16} />}
						tone="danger"
					/>
				</div>

				<span
					className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
					style={{
						left: activeCashPoint?.x ?? 0,
						top: activeCashPoint?.y ?? 0,
					}}
				/>
			</Card>
		</section>
	);
};
