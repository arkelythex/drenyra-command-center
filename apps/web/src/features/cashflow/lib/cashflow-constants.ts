import type {
	ActualCashflowData,
	CashflowForecastData,
	CashflowProjectionData,
} from "../api/cashflow.api";
import type { CashflowTask, ColumnId, Currency } from "../types/cashflow-types";

export const DEFAULT_CURRENCY: Currency = "PEN";
export const DEFAULT_PROJECTION_DAYS = 30;
export const DEFAULT_FORECAST_MONTHS = 3;
export const DEFAULT_ACTUAL_WINDOW_DAYS = 30;
export const FALLBACK_LIQUIDITY = 1121182.37;
export const COLUMN_ORDER: ColumnId[] = [
	"pending",
	"audit",
	"scheduled",
	"completed",
];
export const COLUMN_TITLES: Record<ColumnId, string> = {
	pending: "Pendientes",
	audit: "En Auditoría",
	scheduled: "Programados",
	completed: "Ejecutados",
};

export const FALLBACK_TASKS: Record<string, CashflowTask> = {
	t1: {
		id: "t1",
		title: "Cobro: Enterprise Corp",
		amount: 15000.0,
		date: "15 Ene",
		type: "INCOME",
		priority: "HIGH",
	},
	t2: {
		id: "t2",
		title: "Factura: AWS Peru",
		amount: 450.5,
		date: "Mañana",
		type: "EXPENSE",
		priority: "MEDIUM",
	},
	t3: {
		id: "t3",
		title: "Consultoría Estratégica",
		amount: 2500.0,
		date: "20 Ene",
		type: "EXPENSE",
		priority: "LOW",
	},
	t4: {
		id: "t4",
		title: "Servicios de Limpieza",
		amount: 890.0,
		date: "Vencido",
		type: "EXPENSE",
		priority: "HIGH",
	},
	t5: {
		id: "t5",
		title: "Uber for Business",
		amount: 45.0,
		date: "Hoy",
		type: "EXPENSE",
		priority: "LOW",
	},
	t6: {
		id: "t6",
		title: "Venta Productos Digitales",
		amount: 8750.0,
		date: "12 Ene",
		type: "INCOME",
		priority: "MEDIUM",
	},
	t7: {
		id: "t7",
		title: "Pago Hosting Anual",
		amount: 2400.0,
		date: "18 Ene",
		type: "EXPENSE",
		priority: "MEDIUM",
	},
	t8: {
		id: "t8",
		title: "Auditoría Interna Q4",
		amount: 12500.0,
		date: "25 Ene",
		type: "EXPENSE",
		priority: "HIGH",
	},
	t9: {
		id: "t9",
		title: "Marketing Digital",
		amount: 3200.0,
		date: "Semanal",
		type: "EXPENSE",
		priority: "MEDIUM",
	},
	t10: {
		id: "t10",
		title: "Seguros Empresariales",
		amount: 1800.0,
		date: "Mensual",
		type: "EXPENSE",
		priority: "LOW",
	},
	t11: {
		id: "t11",
		title: "Mantenimiento Software",
		amount: 950.0,
		date: "15 Feb",
		type: "EXPENSE",
		priority: "LOW",
	},
	t12: {
		id: "t12",
		title: "Cobro Proyecto Especial",
		amount: 28500.0,
		date: "10 Ene",
		type: "INCOME",
		priority: "HIGH",
	},
	t13: {
		id: "t13",
		title: "Capacitación Equipo",
		amount: 4200.0,
		date: "22 Ene",
		type: "EXPENSE",
		priority: "MEDIUM",
	},
};

export const FALLBACK_COLUMN_TASK_IDS: Record<ColumnId, string[]> = {
	pending: ["t1", "t2", "t6", "t7", "t12"],
	audit: ["t3", "t8", "t13"],
	scheduled: ["t4", "t5", "t9", "t10", "t11"],
	completed: [],
};

export const FALLBACK_ACTUAL_BASE: ActualCashflowData = {
	companyId: "fallback-company",
	period: {
		startDate: "2026-02-04",
		endDate: "2026-03-05",
	},
	currency: DEFAULT_CURRENCY,
	actualInflows: 48750,
	actualOutflows: 30200,
	netCashflow: 18550,
	transactionCount: {
		inflows: 14,
		outflows: 9,
	},
};

export const FALLBACK_PROJECTION_BASE: CashflowProjectionData = {
	companyId: "fallback-company",
	period: {
		startDate: "2026-03-05",
		endDate: "2026-04-04",
	},
	currency: DEFAULT_CURRENCY,
	summary: {
		totalInflows: 52250,
		totalOutflows: 28935.5,
		netCashflow: 23314.5,
		isDeficit: false,
	},
	inflows: [],
	outflows: [],
	overdueItems: 1,
	weeklyBreakdown: [],
};

export const FALLBACK_FORECAST_BASE: CashflowForecastData = {
	companyId: "fallback-company",
	months: DEFAULT_FORECAST_MONTHS,
	currency: DEFAULT_CURRENCY,
	forecast: [
		{
			month: "2026-04",
			expectedInflows: 18000,
			expectedOutflows: 9200,
			netCashflow: 8800,
			confidence: 0.78,
		},
		{
			month: "2026-05",
			expectedInflows: 17200,
			expectedOutflows: 9600,
			netCashflow: 7600,
			confidence: 0.74,
		},
		{
			month: "2026-06",
			expectedInflows: 18800,
			expectedOutflows: 9800,
			netCashflow: 9000,
			confidence: 0.72,
		},
	],
	method: "historical_average",
	basedOnMonths: 3,
};
