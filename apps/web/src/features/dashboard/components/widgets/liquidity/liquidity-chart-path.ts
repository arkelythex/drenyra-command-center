export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 240;
export const CHART_PADDING_X = 18;
export const CHART_PADDING_Y = 18;

export interface ChartPoint {
	x: number;
	y: number;
}

export const buildPath = (points: ChartPoint[]) =>
	points
		.map(
			(point, index) =>
				`${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
		)
		.join(" ");

export const buildAreaPath = (points: ChartPoint[]) => {
	if (points.length === 0) return "";

	const linePath = buildPath(points);
	const first = points[0];
	const last = points[points.length - 1];
	const baseline = CHART_HEIGHT - CHART_PADDING_Y;

	return `${linePath} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
};
