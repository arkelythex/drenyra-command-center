import { randomUUID } from "node:crypto";
import { type Currency, Money } from "@arkelythex/domain";
import { and, eq } from "@arkelythex/persistence/query";
import {
	bills,
	businessPartners,
	customerProfiles,
	invoices,
	vendorProfiles,
} from "@arkelythex/persistence/schema";
import { withCompanyRlsTransaction } from "../../security/rls-db-context";
import type {
	SireDiffCommitRow,
	SireDocumentRecord,
} from "./sire-diff.service";

export interface LedgerMutationResult {
	updatedInvoices: number;
	updatedBills: number;
	createdInvoices: number;
	createdBills: number;
}

function documentNumber(series: string, number: string): string {
	return `${series}-${number}`;
}

function splitTaxAmounts(total: Money): {
	subtotal: string;
	igv: string;
	total: string;
} {
	const igv = total.divide(1.18).multiply(0.18);
	const subtotal = total.subtract(igv);
	return {
		subtotal: subtotal.toString(),
		igv: igv.toString(),
		total: total.toString(),
	};
}

function parseCorrelative(number: string): number {
	const parsed = Number.parseInt(number, 10);
	return Number.isFinite(parsed) ? parsed : 1;
}

/**
 * Applies accountant ACCEPT_SUNAT resolutions to invoices and bills.
 */
export class SireDiffLedgerService {
	static async applyResolutions(input: {
		companyId: string;
		period: string;
		rows: SireDiffCommitRow[];
		ledgerType?: "ventas" | "compras";
	}): Promise<LedgerMutationResult> {
		const ledgerType = input.ledgerType ?? "compras";
		const mutation: LedgerMutationResult = {
			updatedInvoices: 0,
			updatedBills: 0,
			createdInvoices: 0,
			createdBills: 0,
		};

		await withCompanyRlsTransaction(input.companyId, async (tx) => {
			for (const row of input.rows) {
				if (row.decision !== "ACCEPT_SUNAT") continue;

				if (row.status === "MISMATCH" && row.sunatRecord) {
					const updated = await updateExistingDocument(
						tx,
						input.companyId,
						row.sunatRecord,
					);
					mutation.updatedInvoices += updated.invoices;
					mutation.updatedBills += updated.bills;
					continue;
				}

				if (row.status === "MISSING_LOCAL" && row.sunatRecord) {
					const created = await createMissingDocument(
						tx,
						input.companyId,
						row.sunatRecord,
						ledgerType,
					);
					mutation.createdInvoices += created.invoices;
					mutation.createdBills += created.bills;
				}
			}
		});

		return mutation;
	}
}

type DbTransaction = Parameters<
	Parameters<typeof withCompanyRlsTransaction>[1]
>[0];

async function updateExistingDocument(
	tx: DbTransaction,
	companyId: string,
	record: SireDocumentRecord,
): Promise<{ invoices: number; bills: number }> {
	const invoiceNumber = documentNumber(record.series, record.number);
	const total = Money.fromAmount(record.total, record.currency as Currency);
	const amounts = splitTaxAmounts(total);

	const invoiceUpdate = await tx
		.update(invoices)
		.set({
			totalAmount: amounts.total,
			subtotal: amounts.subtotal,
			igvAmount: amounts.igv,
			balanceDue: amounts.total,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(invoices.companyId, companyId),
				eq(invoices.invoiceNumber, invoiceNumber),
			),
		)
		.returning({ id: invoices.id });

	if (invoiceUpdate.length > 0) {
		return { invoices: 1, bills: 0 };
	}

	const billUpdate = await tx
		.update(bills)
		.set({
			totalAmount: amounts.total,
			subtotalAmount: amounts.subtotal,
			igvAmount: amounts.igv,
			updatedAt: new Date(),
		})
		.where(
			and(eq(bills.companyId, companyId), eq(bills.billNumber, invoiceNumber)),
		)
		.returning({ id: bills.id });

	return { invoices: 0, bills: billUpdate.length > 0 ? 1 : 0 };
}

async function createMissingDocument(
	tx: DbTransaction,
	companyId: string,
	record: SireDocumentRecord,
	ledgerType: "ventas" | "compras",
): Promise<{ invoices: number; bills: number }> {
	const issueDate = record.issueDate ? new Date(record.issueDate) : new Date();
	const dueDate = new Date(issueDate);
	dueDate.setDate(dueDate.getDate() + 30);

	const total = Money.fromAmount(record.total, record.currency as Currency);
	const amounts = splitTaxAmounts(total);
	const invoiceNumber = documentNumber(record.series, record.number);

	if (ledgerType === "ventas") {
		const customerId = await resolveCustomerPartnerId(tx, companyId, record);
		await tx.insert(invoices).values({
			id: randomUUID(),
			companyId,
			customerId,
			invoiceNumber,
			series: record.series,
			correlative: parseCorrelative(record.number),
			issueDate,
			dueDate,
			currency: record.currency as Currency,
			subtotal: amounts.subtotal,
			igvAmount: amounts.igv,
			totalAmount: amounts.total,
			balanceDue: amounts.total,
			status: "DRAFT",
			notes: "Created from SIRE diff ACCEPT_SUNAT resolution",
		});
		return { invoices: 1, bills: 0 };
	}

	const vendorId = await resolveVendorPartnerId(tx, companyId, record);
	await tx.insert(bills).values({
		id: randomUUID(),
		companyId,
		vendorId,
		billNumber: invoiceNumber,
		issueDate,
		dueDate,
		currency: record.currency as Currency,
		subtotalAmount: amounts.subtotal,
		igvAmount: amounts.igv,
		totalAmount: amounts.total,
		status: "DRAFT",
		notes: "Created from SIRE diff ACCEPT_SUNAT resolution",
	});
	return { invoices: 0, bills: 1 };
}

async function resolveCustomerPartnerId(
	tx: DbTransaction,
	companyId: string,
	record: SireDocumentRecord,
): Promise<string> {
	const taxId = record.ruc ?? "00000000000";
	const existing = await tx
		.select({ id: customerProfiles.id })
		.from(customerProfiles)
		.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
		.where(
			and(
				eq(businessPartners.companyId, companyId),
				eq(businessPartners.taxId, taxId),
			),
		)
		.limit(1);

	if (existing[0]?.id) {
		return existing[0].id;
	}

	const partnerId = randomUUID();
	await tx.insert(businessPartners).values({
		id: partnerId,
		companyId,
		taxId,
		legalName: record.reasonSocial ?? `Customer ${taxId}`,
	});
	await tx.insert(customerProfiles).values({ id: partnerId });
	return partnerId;
}

async function resolveVendorPartnerId(
	tx: DbTransaction,
	companyId: string,
	record: SireDocumentRecord,
): Promise<string> {
	const taxId = record.ruc ?? "00000000000";
	const existing = await tx
		.select({ id: vendorProfiles.id })
		.from(vendorProfiles)
		.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
		.where(
			and(
				eq(businessPartners.companyId, companyId),
				eq(businessPartners.taxId, taxId),
			),
		)
		.limit(1);

	if (existing[0]?.id) {
		return existing[0].id;
	}

	const partnerId = randomUUID();
	await tx.insert(businessPartners).values({
		id: partnerId,
		companyId,
		taxId,
		legalName: record.reasonSocial ?? `Vendor ${taxId}`,
	});
	await tx.insert(vendorProfiles).values({ id: partnerId });
	return partnerId;
}
