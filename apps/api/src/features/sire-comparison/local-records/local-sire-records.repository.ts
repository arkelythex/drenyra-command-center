import { and, eq, gte, lt, not } from "@drenyra/persistence/query";
import {
	bills,
	businessPartners,
	companies,
	invoices,
} from "@drenyra/persistence/schema";
import { withCompanyRlsTransaction } from "../../security/rls-db-context";
import {
	type LocalSireRecord,
	periodBounds,
	type SireBookKind,
	toPurchaseRecord,
	toSalesRecord,
} from "./local-sire-records";

/**
 * Reads one company's sales (RVIE) or purchases (RCE) for a `YYYY-MM` period
 * under the tenant RLS context, mapped for the SIRE reconciliation. Drafts
 * are left out: they were never issued, so SUNAT cannot have them.
 */
export async function listLocalSireRecords(
	companyId: string,
	period: string,
	kind: SireBookKind,
): Promise<LocalSireRecord[]> {
	const { start, end } = periodBounds(period);

	return withCompanyRlsTransaction(companyId, async (tx) => {
		if (kind === "RCE") {
			const rows = await tx
				.select({
					billNumber: bills.billNumber,
					issueDate: bills.issueDate,
					currency: bills.currency,
					subtotalAmount: bills.subtotalAmount,
					igvAmount: bills.igvAmount,
					totalAmount: bills.totalAmount,
					status: bills.status,
					vendorTaxId: businessPartners.taxId,
					vendorName: businessPartners.legalName,
				})
				.from(bills)
				.leftJoin(businessPartners, eq(bills.vendorId, businessPartners.id))
				.where(
					and(
						eq(bills.companyId, companyId),
						gte(bills.issueDate, start),
						lt(bills.issueDate, end),
						not(eq(bills.status, "DRAFT")),
					),
				);
			return rows.map((row) => toPurchaseRecord(row, period));
		}

		const [company] = await tx
			.select({ ruc: companies.ruc })
			.from(companies)
			.where(eq(companies.id, companyId))
			.limit(1);
		if (!company) throw new Error(`Company ${companyId} not found`);

		const rows = await tx
			.select({
				series: invoices.series,
				correlative: invoices.correlative,
				issueDate: invoices.issueDate,
				currency: invoices.currency,
				subtotal: invoices.subtotal,
				igvAmount: invoices.igvAmount,
				totalAmount: invoices.totalAmount,
				status: invoices.status,
				customerName: businessPartners.legalName,
			})
			.from(invoices)
			.leftJoin(businessPartners, eq(invoices.customerId, businessPartners.id))
			.where(
				and(
					eq(invoices.companyId, companyId),
					gte(invoices.issueDate, start),
					lt(invoices.issueDate, end),
					not(eq(invoices.status, "DRAFT")),
				),
			);
		return rows.map((row) => toSalesRecord(row, period, company.ruc));
	});
}
