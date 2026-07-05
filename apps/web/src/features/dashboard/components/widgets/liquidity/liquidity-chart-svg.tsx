import type { LiquidityPoint } from "./liquidity-chart.constants";
import {
	CHART_HEIGHT,
	CHART_PADDING_X,
	CHART_PADDING_Y,
	CHART_WIDTH,
	type ChartPoint,
} from "./liquidity-chart-path";

interface LiquidityChartSvgProps {
	chartData: LiquidityPoint[];
	cashPath: string;
	projectedPath: string;
	cashAreaPath: string;
	activeIndex: number;
	cashPoints: ChartPoint[];
	projectedPoints: ChartPoint[];
}

export const LiquidityChartSvg = ({
	chartData,
	cashPath,
	projectedPath,
	cashAreaPath,
	activeIndex,
	cashPoints,
	projectedPoints,
}: LiquidityChartSvgProps) => {
	const innerHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;

	return (
		<svg
			viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
			className="h-[240px] w-full"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="liquidity-surface" x1="0" y1="0" x2="0" y2="1">
					<stop
						offset="0%"
						stopColor="rgb(var(--premium-info-rgb))"
						stopOpacity="0.24"
					/>
					<stop
						offset="100%"
						stopColor="rgb(var(--premium-info-rgb))"
						stopOpacity="0"
					/>
				</linearGradient>
			</defs>

			{[0, 1, 2, 3].map((line) => {
				const y = CHART_PADDING_Y + (innerHeight / 3) * line;
				return (
					<line
						key={line}
						x1={CHART_PADDING_X}
						y1={y}
						x2={CHART_WIDTH - CHART_PADDING_X}
						y2={y}
						stroke="rgba(115,125,139,0.22)"
						strokeDasharray="4 6"
					/>
				);
			})}

			<path d={cashAreaPath} fill="url(#liquidity-surface)" />
			<path
				d={projectedPath}
				fill="none"
				stroke="rgba(115,125,139,0.62)"
				strokeDasharray="5 6"
				strokeWidth="2"
			/>
			<path d={cashPath} fill="none" stroke="#F7F1E8" strokeWidth="3.5" />

			{projectedPoints.map((point, index) => (
				<circle
					key={`projected-${chartData[index]?.month}`}
					cx={point.x}
					cy={point.y}
					r="2.5"
					fill="rgba(115,125,139,0.88)"
				/>
			))}

			{cashPoints.map((point, index) => {
				const isActive = index === activeIndex;

				return (
					<g key={chartData[index]?.month}>
						<circle
							cx={point.x}
							cy={point.y}
							r={isActive ? 6 : 4}
							fill="rgb(var(--premium-info-rgb))"
							stroke="rgba(2,4,6,0.94)"
							strokeWidth={isActive ? 3 : 2}
						/>
						{isActive ? (
							<circle
								cx={point.x}
								cy={point.y}
								r="12"
								fill="none"
								stroke="rgba(var(--premium-info-rgb),0.34)"
								strokeWidth="2"
							/>
						) : null}
					</g>
				);
			})}
		</svg>
	);
};
