import type { DashboardIncomeResponse } from "../../../api/dashboard.api";

export const SUPPRESSIBLE_HTTP_STATUSES = new Set([404, 405, 501]);

export const INCOME_FALLBACK: DashboardIncomeResponse = {
	totalBilled: 71_980,
	totalIgv: 12_956.4,
	collected: 67_420,
	pending: 3_500,
	overdue: 1_060,
	invoiceCount: 32,
	collectionRate: 94.2,
	currency: "PEN",
	billingEvolution: [
		{ month: "2026-01", label: "Ene", total: 48_000, igv: 8_640, count: 8 },
		{ month: "2026-02", label: "Feb", total: 59_000, igv: 10_620, count: 9 },
		{ month: "2026-03", label: "Mar", total: 55_000, igv: 9_900, count: 7 },
		{ month: "2026-04", label: "Abr", total: 77_000, igv: 13_860, count: 8 },
	],
	topCustomers: [
		{
			customerId: "fallback-c1",
			customerName: "Corp Logística del Perú",
			total: 28_000,
			invoiceCount: 4,
		},
		{
			customerId: "fallback-c2",
			customerName: "Inmobiliaria Interamericana",
			total: 22_500,
			invoiceCount: 3,
		},
		{
			customerId: "fallback-c3",
			customerName: "Transportes Rápidos Sur",
			total: 13_600,
			invoiceCount: 2,
		},
	],
};
