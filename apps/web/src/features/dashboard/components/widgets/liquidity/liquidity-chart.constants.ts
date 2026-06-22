import { n, nCompact } from "@/lib/utils";

export const MOCK_DATA = [
	{ month: "Sep", cash: 980000, projected: 950000 },
	{ month: "Oct", cash: 1020000, projected: 990000 },
	{ month: "Nov", cash: 950000, projected: 1010000 },
	{ month: "Dec", cash: 1100000, projected: 1050000 },
	{ month: "Jan", cash: 1050000, projected: 1080000 },
	{ month: "Feb", cash: 1150000, projected: 1100000 },
	{ month: "Mar", cash: 1080000, projected: 1120000 },
	{ month: "Apr", cash: 1200000, projected: 1150000 },
	{ month: "May", cash: 1180000, projected: 1160000 },
	{ month: "Jun", cash: 1250000, projected: 1190000 },
	{ month: "Jul", cash: 1220000, projected: 1210000 },
	{ month: "Aug", cash: 1121182.37, projected: 1250000 },
] as const;

export const PEN_FORMATTER: Intl.NumberFormat = {
	format: (v: number) => n(v),
} as Intl.NumberFormat;

export const PEN_COMPACT_FORMATTER: Intl.NumberFormat = {
	format: (v: number) => nCompact(v),
} as Intl.NumberFormat;

export const PERCENT_FORMATTER = new Intl.NumberFormat("es-PE", {
	style: "percent",
	minimumFractionDigits: 2,
});

export type LiquidityPoint = {
	month: string;
	cash: number;
	projected: number;
	delta: number;
	deltaPct: number;
};

export type LiquidityTooltipEntry = {
	name?: string;
	color?: string;
	value?: number;
	payload: LiquidityPoint;
};

export type LiquidityTooltipProps = {
	active?: boolean;
	label?: string | number;
	payload?: LiquidityTooltipEntry[];
};
