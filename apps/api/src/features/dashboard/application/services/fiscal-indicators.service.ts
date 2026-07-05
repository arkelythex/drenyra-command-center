import { db } from "@drenyra/persistence/client";
import { and, eq, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";

// SUNAT 2026 tax calendar - monthly obligations by last RUC digit
const SUNAT_2026_DEADLINES: Record<string, Record<number, string>> = {
	"2026-01": {
		0: "2026-02-13",
		1: "2026-02-14",
		2: "2026-02-17",
		3: "2026-02-18",
		4: "2026-02-19",
		5: "2026-02-20",
		6: "2026-02-21",
		7: "2026-02-24",
		8: "2026-02-25",
		9: "2026-02-26",
	},
	"2026-02": {
		0: "2026-03-13",
		1: "2026-03-14",
		2: "2026-03-17",
		3: "2026-03-18",
		4: "2026-03-19",
		5: "2026-03-20",
		6: "2026-03-21",
		7: "2026-03-24",
		8: "2026-03-25",
		9: "2026-03-26",
	},
};

/**
 * FiscalIndicatorsService class.
 *
 * @example
 * ```ts
 * const value = new FiscalIndicatorsService();
 * console.log(value);
 * ```
 */
export class FiscalIndicatorsService {
	/**
	 * Exchange rate and UIT - hardcoded fallback for MVP
	 * TODO: Connect to SUNAT APIs.sunat.gob.pe/v1/tc/tipo-cambio when available
	 */
	static getIndicators() {
		return {
			exchangeRate: {
				compra: 3.745,
				venta: 3.758,
				date: new Date().toISOString().split("T")[0],
				source: "SUNAT (fallback)",
			},
			uit: {
				year: 2026,
				value: 5500,
				currency: "PEN" as const,
			},
		};
	}

	/**
	 * Tax calendar obligations for a company
	 */
	static async getTaxCalendar(
		companyId: string,
		month?: number,
		year?: number,
	) {
		const now = new Date();
		const targetMonth = month ?? now.getMonth() + 1;
		const targetYear = year ?? now.getFullYear();
		const period = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

		// Count invoices to determine obligations
		const invoiceCount = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(eq(invoices.companyId, companyId));

		const hasActivity = (invoiceCount[0]?.count || 0) > 0;

		const obligations = [
			{
				code: "PDT621",
				name: "Declaración Jurada Mensual IGV-Renta",
				period,
				dueDate:
					SUNAT_2026_DEADLINES[period]?.[0] ??
					`${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-15`,
				status: hasActivity ? ("PENDING" as const) : ("NOT_REQUIRED" as const),
			},
			{
				code: "SIRE",
				name: "Registro de Ventas e Ingresos (RVIE)",
				period,
				dueDate: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-10`,
				status: "PENDING" as const,
			},
			{
				code: "PLE",
				name: "Libros Electrónicos PLE",
				period,
				dueDate:
					SUNAT_2026_DEADLINES[period]?.[0] ??
					`${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-15`,
				status: "PENDING" as const,
			},
			{
				code: "SPOT",
				name: "Detracciones - Depósito",
				period,
				dueDate: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-05`,
				status: "PENDING" as const,
			},
		];

		return { period, obligations };
	}

	/**
	 * SIRE matching status
	 */
	static async getSireStatus(companyId: string, period?: string) {
		const now = new Date();
		const targetPeriod =
			period ??
			`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		const [yearStr, monthStr] = targetPeriod.split("-");
		const startDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
		const endDate = new Date(Number(yearStr), Number(monthStr), 0);

		const result = await db
			.select({
				total: sql<number>`COUNT(*)`,
				accepted: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} = 'ACCEPTED')`,
				pending: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} IS NULL OR ${invoices.sunatStatus} = 'SUBMITTED')`,
				rejected: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} = 'REJECTED')`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					sql`${invoices.issueDate} >= ${startDate}`,
					sql`${invoices.issueDate} <= ${endDate}`,
				),
			);

		const row = result[0] ?? { total: 0, accepted: 0, pending: 0, rejected: 0 };

		return {
			period: targetPeriod,
			totalInvoices: row.total,
			matched: row.accepted,
			unmatched: row.pending,
			rejected: row.rejected,
			pendingSubmission: row.pending,
		};
	}
}
