import type { DashboardMetric } from "../types/intelligence.types";

/** Empty state for metrics when no data is available */
export const EMPTY_METRICS: DashboardMetric[] = [
	{
		id: "anomalies",
		label: "Anomalías Detectadas",
		value: 0,
		icon: "AlertTriangle",
		color: "danger",
		trend: "neutral",
	},
	{
		id: "cashflow",
		label: "Flujo de Caja Proyectado",
		value: "$0",
		icon: "TrendingUp",
		color: "primary",
		trend: "neutral",
	},
	{
		id: "compliance",
		label: "Obligaciones Pendientes",
		value: 0,
		icon: "CalendarClock",
		color: "warning",
		trend: "neutral",
	},
	{
		id: "suppliers",
		label: "Proveedores en Riesgo",
		value: 0,
		icon: "Users",
		color: "info",
		trend: "neutral",
	},
];

/** Severity labels mapped to display text */
export const SEVERITY_LABELS: Record<string, string> = {
	low: "Bajo",
	medium: "Medio",
	high: "Alto",
	critical: "Crítico",
};

/** Severity colors for Tailwind classes */
export const SEVERITY_COLORS: Record<
	string,
	{ bg: string; text: string; dot: string }
> = {
	low: {
		bg: "bg-[var(--color-success)]/10",
		text: "text-[var(--color-success)]",
		dot: "bg-[var(--color-success)]",
	},
	medium: {
		bg: "bg-[var(--color-warning)]/10",
		text: "text-[var(--color-warning)]",
		dot: "bg-[var(--color-warning)]",
	},
	high: {
		bg: "bg-[var(--color-danger)]/10",
		text: "text-[var(--color-danger)]",
		dot: "bg-[var(--color-danger)]",
	},
	critical: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
};

/** Compliance status colors */
export const COMPLIANCE_STATUS_COLORS: Record<
	string,
	{ bg: string; text: string }
> = {
	pending: {
		bg: "bg-[var(--color-warning)]/10",
		text: "text-[var(--color-warning)]",
	},
	filed: {
		bg: "bg-[var(--color-success)]/10",
		text: "text-[var(--color-success)]",
	},
	overdue: {
		bg: "bg-[var(--color-danger)]/10",
		text: "text-[var(--color-danger)]",
	},
	exempt: {
		bg: "bg-[var(--color-muted)]/10",
		text: "text-[var(--text-muted)]",
	},
};

/** Document type icons */
export const DOCUMENT_TYPE_ICONS: Record<string, string> = {
	invoice: "FileText",
	receipt: "Receipt",
	identity: "IdCard",
	contract: "FileSignature",
	bank_statement: "Landmark",
	sunat_xml: "FileCode",
};
