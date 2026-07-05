// apps/web/src/stores/accounting-types.ts
export interface Company {
	id: string;
	name: string;
	ruc: string;
	logo?: string;
	color?: string;
}

export interface FiscalPeriod {
	id: string;
	label: string;
	year: number;
	month?: number;
	isClosed: boolean;
	startDate: string;
	endDate: string;
}

export type AccountingModuleId =
	| "asientos"
	| "facturas"
	| "bancos"
	| "reportes"
	| "impuestos"
	| "presupuestos"
	| "conciliaciones"
	| "cierre";

export interface AccountingModule {
	id: AccountingModuleId;
	label: string;
	icon: string;
	description: string;
	badge?: number;
}

export interface FinancialReportData {
	id: string;
	type: "balance" | "income" | "cashflow" | "kpi";
	title: string;
	period: string;
	data: Record<string, number | string>;
	sections?: FinancialReportSection[];
	comparedTo?: string;
	variance?: Record<string, number>;
}

export interface FinancialReportSection {
	label: string;
	items: Array<{
		name: string;
		value: number;
		previousValue?: number;
		variance?: number;
		isTotal?: boolean;
	}>;
}

export interface KpiMetric {
	id: string;
	label: string;
	value: number;
	previousValue: number;
	variance: number;
	trend: "up" | "down" | "neutral";
	format: "currency" | "percentage" | "number" | "days";
	icon?: string;
}

export interface ProposedEntry {
	id: string;
	date: string;
	glosa: string;
	entries: Array<{
		cuenta: string;
		cuentaLabel: string;
		debe: number;
		haber: number;
	}>;
	status: "pending" | "reviewing" | "approved" | "rejected";
	proposedBy: "agent" | "human";
	agentId?: string;
	createdAt: string;
	impactSummary?: string;
}

export const ACCOUNTING_MODULES: AccountingModule[] = [
	{
		id: "asientos",
		label: "Asientos",
		icon: "BookOpen",
		description: "Diario y mayor",
		badge: 3,
	},
	{
		id: "facturas",
		label: "Facturas",
		icon: "FileText",
		description: "Comprobantes",
		badge: 12,
	},
	{
		id: "bancos",
		label: "Bancos",
		icon: "Landmark",
		description: "Conciliaciones",
		badge: 0,
	},
	{
		id: "conciliaciones",
		label: "Conciliaciones",
		icon: "ArrowLeftRight",
		description: "Bancarias y cuentas",
	},
	{
		id: "reportes",
		label: "Reportes",
		icon: "BarChart3",
		description: "Estados financieros",
	},
	{
		id: "impuestos",
		label: "Impuestos",
		icon: "Receipt",
		description: "IGV, Renta, SIRE",
		badge: 5,
	},
	{
		id: "presupuestos",
		label: "Presupuestos",
		icon: "Calculator",
		description: "Planificación",
	},
	{
		id: "cierre",
		label: "Cierre Mensual",
		icon: "CalendarCheck",
		description: "Periodo contable",
		badge: 1,
	},
];
