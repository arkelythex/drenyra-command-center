import type { MobileSummaryTab } from "./mobile-summary.types";

export const MOBILE_SUMMARY_TABS: MobileSummaryTab[] = [
	"resumen",
	"gastos",
	"ingresos",
];

export const MOBILE_SUMMARY_Y_AXIS_LABELS = [
	"S/ 1.3M",
	"S/ 1.2M",
	"S/ 1.1M",
	"S/ 1.0M",
	"S/ 0.9M",
];

export const MOBILE_SUMMARY_MONTHS = [
	"S",
	"O",
	"N",
	"D",
	"J",
	"F",
	"M",
	"A",
	"M",
	"J",
	"J",
	"A",
];

export const MOBILE_SUMMARY_SCORE = {
	value: 942,
	max: 1000,
	label: "Compliance Score",
} as const;
