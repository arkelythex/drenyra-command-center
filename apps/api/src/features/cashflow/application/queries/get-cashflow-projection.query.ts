/**
 * Get Cashflow Projection Query
 *
 * Returns projected cash inflows and outflows for a period.
 *
 * @module cashflow/application/queries
 */

import { type Currency, Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, lte, or } from "@drenyra/persistence/query";
import { bills, invoices, retenciones } from "@drenyra/persistence/schema";
import {
	type CashflowItem,
	CashflowProjection,
} from "../../domain/cashflow-projection";

/**
 * Input contract for generating a short-term projected cashflow window.
 *
 * @example
 * ```ts
 * const input: GetCashflowProjectionInput = { companyId: 'cmp_1', days: 30 };
 * ```
 */
export interface GetCashflowProjectionInput {
	companyId: string;
	days?: number; // Default: 30 days
	currency?: Currency; // Default: 'PEN'
}

/**
 * Map invoice status to cashflow item status
 */
function mapInvoiceStatus(status: string): CashflowItem["status"] {
	switch (status) {
		case "SENT":
			return "pending";
		case "OVERDUE":
			return "overdue";
		case "PAID":
			return "paid";
		default:
			return "pending";
	}
}

/**
 * Map bill status to cashflow item status
 */
function mapBillStatus(status: string): CashflowItem["status"] {
	switch (status) {
		case "DRAFT":
		case "SENT":
			return "pending";
		case "OVERDUE":
			return "overdue";
		case "PAID":
			return "paid";
		default:
			return "pending";
	}
}

/**
 * Get Cashflow Projection
 *
 * Retrieves projected cashflow from:
 * - Inflows: Unpaid invoices (SENT, OVERDUE)
 * - Outflows: Unpaid bills (PENDING, OVERDUE)
 *
 * @example
 * ```ts
 * const projection = await getCashflowProjection({ companyId: 'cmp_1', days: 30 });
 * ```
 */
export async function getCashflowProjection(
	input: GetCashflowProjectionInput,
): Promise<CashflowProjection> {
	const days = input.days || 30;
	const currency = input.currency || "PEN";
	const startDate = new Date();
	const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

	// Get unpaid invoices (expected inflows)
	const inflowsData = await db
		.select({
			id: invoices.id,
			reference: invoices.invoiceNumber,
			amount: invoices.totalAmount,
			dueDate: invoices.dueDate,
			status: invoices.status,
			customerId: invoices.customerId,
		})
		.from(invoices)
		.where(
			and(
				eq(invoices.companyId, input.companyId),
				or(eq(invoices.status, "SENT"), eq(invoices.status, "OVERDUE")),
				lte(invoices.dueDate, endDate),
			),
		);

	const inflows: CashflowItem[] = inflowsData.map((row) => ({
		id: row.id,
		type: "inflow" as const,
		documentType: "invoice" as const,
		reference: row.reference,
		amount: Money.fromAmount(Number(row.amount), currency),
		dueDate: new Date(row.dueDate),
		status: mapInvoiceStatus(row.status),
		customerOrVendor: row.customerId, // Using ID for now, could JOIN with businessPartners for name
	}));

	// Get unpaid bills (expected outflows)
	const outflowsData = await db
		.select({
			id: bills.id,
			reference: bills.billNumber,
			amount: bills.totalAmount,
			dueDate: bills.dueDate,
			status: bills.status,
			vendorId: bills.vendorId,
		})
		.from(bills)
		.where(
			and(
				eq(bills.companyId, input.companyId),
				or(
					eq(bills.status, "SENT"), // Changed from PENDING to SENT
					eq(bills.status, "OVERDUE"),
				),
				lte(bills.dueDate, endDate),
			),
		);

	// Query active retentions (PENDING/DECLARED) for outflow adjustment
	const retentionRows = await db
		.select({
			billId: retenciones.billId,
			retentionAmountCents: retenciones.retentionAmountCents,
			sunatDueDate: retenciones.sunatDueDate,
			declarationPeriod: retenciones.declarationPeriod,
		})
		.from(retenciones)
		.where(
			and(
				eq(retenciones.companyId, input.companyId),
				or(
					eq(retenciones.status, "PENDING"),
					eq(retenciones.status, "DECLARED"),
				),
			),
		);

	// Build a map for O(1) lookup: billId → retention data
	const retentionByBill = new Map(retentionRows.map((r) => [r.billId, r]));

	const outflows: CashflowItem[] = [];

	for (const row of outflowsData) {
		const retention = retentionByBill.get(row.id);
		const fullAmount = Money.fromAmount(Number(row.amount), currency);
		const dueDate = new Date(row.dueDate);
		const status = mapBillStatus(row.status);

		if (retention) {
			// Split: (1) net-to-supplier on the original due date
			const retentionMoney = Money.fromCents(
				retention.retentionAmountCents,
				currency,
			);
			const netToSupplier = fullAmount.subtract(retentionMoney);

			outflows.push({
				id: row.id,
				type: "outflow",
				documentType: "bill",
				reference: row.reference,
				amount: netToSupplier,
				dueDate,
				status,
				customerOrVendor: row.vendorId,
			});

			// (2) SUNAT retention obligation due day-15 of following month
			outflows.push({
				id: `retention-${row.id}`,
				type: "outflow",
				documentType: "retention" as CashflowItem["documentType"],
				reference: `RET-${retention.declarationPeriod}`,
				amount: retentionMoney,
				dueDate: new Date(retention.sunatDueDate),
				status: "pending",
				customerOrVendor: "SUNAT",
			});
		} else {
			outflows.push({
				id: row.id,
				type: "outflow",
				documentType: "bill",
				reference: row.reference,
				amount: fullAmount,
				dueDate,
				status,
				customerOrVendor: row.vendorId,
			});
		}
	}

	return new CashflowProjection(
		input.companyId,
		startDate,
		endDate,
		currency,
		inflows,
		outflows,
	);
}
