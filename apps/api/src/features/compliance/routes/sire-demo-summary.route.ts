import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte } from "@arkelythex/persistence/query";
import { bills, invoices } from "@arkelythex/persistence/schema";
import { Elysia } from "elysia";
import { z } from "zod";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { resolveYearMonth } from "../../sire/routes/helpers";
import { SireRegisterExportService as SIREService } from "../../sire/services/sire-register-export.service";

const SireDemoSummaryQuerySchema = z.object({
	companyId: z.string().min(1),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
		.optional(),
});

async function buildLedgerSummary(input: {
	companyId: string;
	year: number;
	month: number;
	ledgerType: "ventas" | "compras";
}) {
	const exportResult =
		input.ledgerType === "ventas"
			? await SIREService.generateSalesRegister({
					year: input.year,
					month: input.month,
					companyId: input.companyId,
					format: "TXT",
				})
			: await SIREService.generatePurchasesRegister({
					year: input.year,
					month: input.month,
					companyId: input.companyId,
					format: "TXT",
				});

	const content =
		typeof exportResult === "string"
			? exportResult
			: exportResult.toString("utf-8");
	const validation = SIREService.validateSIREFormat(
		content,
		input.ledgerType === "ventas" ? "sales" : "purchases",
	);

	return {
		recordCount: validation.recordCount,
		warningCount: validation.warnings.length,
		isValid: validation.isValid,
	};
}

function formatAmount(value: string | number): string {
	const amount = typeof value === "number" ? value : Number.parseFloat(value);
	return `S/ ${amount.toFixed(2)}`;
}

function formatShortDate(date: Date): string {
	const monthMap = [
		"ENE",
		"FEB",
		"MAR",
		"ABR",
		"MAY",
		"JUN",
		"JUL",
		"AGO",
		"SEP",
		"OCT",
		"NOV",
		"DIC",
	];
	return `${date.getDate().toString().padStart(2, "0")} ${monthMap[date.getMonth()]}`;
}

function mapInvoiceSunatStatus(
	value:
		| "DRAFT"
		| "SUBMITTED"
		| "ACCEPTED"
		| "OBSERVED"
		| "REJECTED"
		| "ANNULLED"
		| null
		| undefined,
) {
	switch (value) {
		case "ACCEPTED":
			return "Sincronizado" as const;
		case "OBSERVED":
			return "Observado" as const;
		case "REJECTED":
			return "Rechazado" as const;
		case "ANNULLED":
			return "Anulado" as const;
		case "SUBMITTED":
			return "En Proceso" as const;
		default:
			return "Propuesta" as const;
	}
}

function mapInvoiceInternalStatus(
	value: "DRAFT" | "SENT" | "OVERDUE" | "PAID" | "CANCELLED",
) {
	switch (value) {
		case "PAID":
		case "OVERDUE":
			return "Registrado" as const;
		case "CANCELLED":
			return "Anulado" as const;
		case "SENT":
			return "En Proceso" as const;
		default:
			return "No Registrado" as const;
	}
}

function mapBillStatus(
	value: "DRAFT" | "SENT" | "OVERDUE" | "PAID" | "CANCELLED",
) {
	switch (value) {
		case "PAID":
		case "OVERDUE":
		case "SENT":
			return "Registrado" as const;
		case "CANCELLED":
			return "Anulado" as const;
		default:
			return "En Proceso" as const;
	}
}

async function buildPreviewRows(input: {
	companyId: string;
	year: number;
	month: number;
}) {
	const startDate = new Date(input.year, input.month - 1, 1);
	const endDate = new Date(input.year, input.month, 0);

	const [salesRows, purchaseRows] = await Promise.all([
		db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, input.companyId),
				gte(invoices.issueDate, startDate),
				lte(invoices.issueDate, endDate),
			),
			with: {
				customer: true,
			},
			orderBy: [invoices.issueDate, invoices.invoiceNumber],
			limit: 4,
		}),
		db.query.bills.findMany({
			where: and(
				eq(bills.companyId, input.companyId),
				gte(bills.issueDate, startDate),
				lte(bills.issueDate, endDate),
			),
			with: {
				vendor: true,
			},
			orderBy: [bills.issueDate, bills.billNumber],
			limit: 3,
		}),
	]);

	return [
		...salesRows.map((entry) => ({
			icon: "file" as const,
			id: entry.invoiceNumber,
			provider: entry.customer?.legalName ?? "Cliente Demo",
			sunatStatus: mapInvoiceSunatStatus(entry.sunatStatus),
			internalStatus: mapInvoiceInternalStatus(entry.status),
			amount: formatAmount(entry.totalAmount),
			date: formatShortDate(entry.issueDate),
			isCritical:
				entry.sunatStatus === "OBSERVED" || entry.sunatStatus === "REJECTED",
		})),
		...purchaseRows.map((entry) => ({
			icon: "file" as const,
			id: entry.billNumber,
			provider: entry.vendor?.legalName ?? "Proveedor Demo",
			sunatStatus: mapBillStatus(entry.status),
			internalStatus: mapBillStatus(entry.status),
			amount: formatAmount(entry.totalAmount),
			date: formatShortDate(entry.issueDate),
		})),
	];
}

/**
 * sireDemoSummaryRoute const.
 *
 * @example
 * ```ts
 * console.log(sireDemoSummaryRoute);
 * ```
 */
export const sireDemoSummaryRoute = new Elysia().get(
	"/sire-demo-summary",
	async ({ query, set }) => {
		try {
			const { year, month, period } = resolveYearMonth(query.period);
			const generatedAt = new Date().toISOString();
			const [sales, purchases, previewRows] = await Promise.all([
				buildLedgerSummary({
					companyId: query.companyId,
					year,
					month,
					ledgerType: "ventas",
				}),
				buildLedgerSummary({
					companyId: query.companyId,
					year,
					month,
					ledgerType: "compras",
				}),
				buildPreviewRows({
					companyId: query.companyId,
					year,
					month,
				}),
			]);

			const warningCount = sales.warningCount + purchases.warningCount;

			return ok({
				source: "demo-seed" as const,
				period,
				generatedAt,
				sales,
				purchases,
				matches: sales.recordCount + purchases.recordCount,
				differences: warningCount,
				previewRows,
			});
		} catch (error: unknown) {
			set.status = 500;
			return fail(getErrorMessage(error), "SIRE_DEMO_SUMMARY_ERROR");
		}
	},
	{
		query: SireDemoSummaryQuerySchema,
		detail: {
			tags: ["Compliance", "SIRE"],
			summary: "Get SIRE demo summary",
			description:
				"Devuelve el resumen de registros y alertas del dataset demo SIRE para el periodo solicitado.",
		},
	},
);
