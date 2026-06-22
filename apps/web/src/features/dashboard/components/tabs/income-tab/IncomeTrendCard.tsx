import { Card } from "@/components/ui/card";
import { cn, formatPEN, formatPercent } from "@/lib/utils";
import type { IncomeTrendPoint } from "./types";

interface IncomeTrendCardProps {
	trendData: IncomeTrendPoint[];
	averageBilling: number;
	latestPoint?: IncomeTrendPoint;
	peakPeriod: IncomeTrendPoint | null;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 260;
const CHART_PADDING_X = 28;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 36;
const BAR_WIDTH = 34;

const buildPath = (points: { x: number; y: number }[]) =>
	points
		.map(
			(point, index) =>
				`${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
		)
		.join(" ");

export function IncomeTrendCard({
	trendData,
	averageBilling,
	latestPoint,
	peakPeriod,
}: IncomeTrendCardProps) {
	const latestChange =
		latestPoint && typeof latestPoint.changePct === "number"
			? formatPercent(latestPoint.changePct)
			: "N/A";
	const latestTone =
		latestPoint && typeof latestPoint.changePct === "number"
			? latestPoint.changePct > 0
				? "text-success"
				: latestPoint.changePct < 0
					? "text-danger"
					: "text-info"
			: "text-muted-foreground";

	if (trendData.length === 0) {
		return (
			<Card className="xl:col-span-8 rounded-[28px] border border-border/40 bg-white p-6 shadow-sm">
				<div>
					<h3 className="text-sm font-semibold text-foreground">
						Evolución de facturación
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						No hay evolución de ingresos disponible para este periodo.
					</p>
				</div>
			</Card>
		);
	}

	const maxTotal = Math.max(...trendData.map((item) => item.total), 1);
	const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
	const innerHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
	const spacing = innerWidth / Math.max(trendData.length - 1, 1);

	const barData = trendData.map((item, index) => {
		const height = Math.max((item.total / maxTotal) * innerHeight, 8);
		const x = CHART_PADDING_X + spacing * index;
		const y = CHART_PADDING_TOP + (innerHeight - height);
		const avgY =
			CHART_PADDING_TOP +
			(innerHeight - Math.max((item.avg3 / maxTotal) * innerHeight, 0));

		return {
			item,
			x,
			y,
			height,
			centerX: x + BAR_WIDTH / 2,
			avgY,
		};
	});

	const avgPath = buildPath(
		barData.map((point) => ({ x: point.centerX, y: point.avgY })),
	);
	const averageLineY =
		CHART_PADDING_TOP +
		(innerHeight - Math.max((averageBilling / maxTotal) * innerHeight, 0));

	return (
		<Card className="xl:col-span-8 rounded-[28px] border border-border/40 bg-white p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-2xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Revenue intelligence
					</p>
					<h3 className="mt-2 text-sm font-semibold text-foreground">
						Evolución de facturación
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{latestPoint
							? `${latestPoint.changePct && latestPoint.changePct > 0 ? "Crecimiento" : "Variación"} del último periodo: ${
									latestChange
								}`
							: "Sin datos para el periodo"}
					</p>
				</div>
				<div className="rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-label font-medium text-muted-foreground">
					Últimos {trendData.length} periodos
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
				<div
					className="rounded-[24px] border border-border/40 bg-muted/5 p-4"
					aria-hidden="true"
				>
					<svg
						viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
						className="h-80 w-full"
					>
						{[0, 1, 2, 3].map((line) => {
							const y = CHART_PADDING_TOP + (innerHeight / 3) * line;
							return (
								<line
									key={line}
									x1={CHART_PADDING_X}
									y1={y}
									x2={CHART_WIDTH - CHART_PADDING_X}
									y2={y}
									stroke="rgba(0,0,0,0.06)"
									strokeDasharray="4 6"
								/>
							);
						})}

						<line
							x1={CHART_PADDING_X}
							y1={averageLineY}
							x2={CHART_WIDTH - CHART_PADDING_X}
							y2={averageLineY}
							stroke="rgba(0,0,0,0.12)"
							strokeDasharray="5 6"
						/>

						<path
							d={avgPath}
							fill="none"
							stroke="hsl(var(--primary))"
							strokeWidth="2.5"
							strokeDasharray="6 4"
							strokeLinejoin="round"
							opacity={0.6}
						/>

						{barData.map((point, index) => (
							<g key={point.item.month}>
								<rect
									x={point.x}
									y={point.y}
									width={BAR_WIDTH}
									height={point.height}
									rx={8}
									fill={
										index === barData.length - 1
											? "hsl(var(--primary))"
											: "hsl(var(--primary) / 0.12)"
									}
								/>
								<circle
									cx={point.centerX}
									cy={point.avgY}
									r="4"
									fill="hsl(var(--primary))"
									stroke="white"
									strokeWidth="2"
								/>
							</g>
						))}
					</svg>

					<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
						{trendData.map((entry, index) => (
							<div
								key={entry.month}
								className={cn(
									"rounded-xl border px-3 py-2.5 shadow-sm",
									index === trendData.length - 1
										? "border-primary/20 bg-primary/5"
										: "border-border/40 bg-white",
								)}
							>
								<span className="block text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
									{entry.label}
								</span>
								<span className="mt-1 block text-label font-semibold tracking-tight text-foreground">
									{formatPEN(entry.total)}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<div className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-sm">
						<p className="text-xs font-medium text-muted-foreground">
							Promedio mensual
						</p>
						<p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
							{formatPEN(averageBilling)}
						</p>
					</div>
					<div className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-sm">
						<p className="text-xs font-medium text-muted-foreground">
							Periodo pico
						</p>
						<p className="mt-1 text-sm font-semibold text-foreground">
							{peakPeriod
								? `${peakPeriod.label} · ${formatPEN(peakPeriod.total)}`
								: "Sin datos"}
						</p>
					</div>
					<div className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-sm">
						<p className="text-xs font-medium text-muted-foreground">
							Última tendencia
						</p>
						<p
							className={cn(
								"mt-1 text-sm font-semibold tabular-nums",
								latestTone,
							)}
						>
							{latestChange}
						</p>
					</div>
				</div>
			</div>
		</Card>
	);
}
