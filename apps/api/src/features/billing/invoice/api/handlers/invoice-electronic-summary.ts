import { db } from "@drenyra/persistence/client";
import { and, eq, or } from "@drenyra/persistence/query";
import { transactions } from "@drenyra/persistence/schema";
import type { Invoice } from "../../domain/invoice.entity";

/**
 * Electronic invoicing summary projected from transaction metadata.
 *
 * @example
 * ```ts
 * const summary: InvoiceElectronicSummary = {
 *   transactionId: "tx_1",
 *   transactionStatus: "accepted",
 *   sunatStatus: "ACEPTADO",
 *   sunatCode: null,
 *   sunatMessage: null,
 * };
 * ```
 */
export interface InvoiceElectronicSummary {
	transactionId: string;
	transactionStatus: string | null;
	sunatStatus: string | null;
	sunatCode: string | null;
	sunatMessage: string | null;
}

type TransactionSummaryRow = {
	id: string;
	series: string | null;
	number: string | null;
	status: string | null;
	tags: unknown;
};

function toInvoiceKey(series: string, correlative: number): string {
	return `${series}:${correlative}`;
}

function toCorrelativeCandidates(correlative: number): string[] {
	const normalized = String(correlative);
	const padded = normalized.padStart(8, "0");

	return normalized === padded ? [normalized] : [normalized, padded];
}

function readObject(value: unknown): Record<string, unknown> {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}

	return {};
}

function readString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function extractSummary(row: TransactionSummaryRow): InvoiceElectronicSummary {
	const tags = readObject(row.tags);
	const electronic = readObject(tags.electronicInvoicing);

	return {
		transactionId: row.id,
		transactionStatus: readString(row.status),
		sunatStatus: readString(electronic.sunatStatus) ?? readString(row.status),
		sunatCode: readString(electronic.sunatCode),
		sunatMessage: readString(electronic.sunatMessage),
	};
}

/**
 * Resolves the latest electronic summaries for a set of invoices.
 *
 * @param invoicesToResolve - Invoice aggregates to enrich with transaction data
 * @returns Map keyed by invoice id with electronic summary data
 * @example
 * ```ts
 * const summaries = await loadInvoiceElectronicSummaries(invoices);
 * ```
 */
export async function loadInvoiceElectronicSummaries(
	invoicesToResolve: Invoice[],
): Promise<Map<string, InvoiceElectronicSummary>> {
	if (invoicesToResolve.length === 0) {
		return new Map();
	}

	const companyId = invoicesToResolve[0]?.companyId;
	if (!companyId) {
		return new Map();
	}

	const invoiceClauses = invoicesToResolve.map((invoice) => {
		const numberClauses = toCorrelativeCandidates(invoice.correlative).map(
			(candidate) => eq(transactions.number, candidate),
		);

		const numberPredicate =
			numberClauses.length === 1 ? numberClauses[0] : or(...numberClauses);

		return and(eq(transactions.series, invoice.series), numberPredicate);
	});

	const whereClause =
		invoiceClauses.length === 1 ? invoiceClauses[0] : or(...invoiceClauses);

	const rows = await db.query.transactions.findMany({
		where: and(eq(transactions.companyId, companyId), whereClause),
		columns: {
			id: true,
			series: true,
			number: true,
			status: true,
			tags: true,
		},
		orderBy: (table, { desc }) => desc(table.updatedAt),
	});

	const summariesByKey = new Map<string, InvoiceElectronicSummary>();
	for (const row of rows) {
		const series = readString(row.series);
		const number = readString(row.number);
		if (!series || !number) {
			continue;
		}

		const numericCorrelative = Number.parseInt(number, 10);
		if (!Number.isNaN(numericCorrelative)) {
			const invoiceKey = toInvoiceKey(series, numericCorrelative);
			if (!summariesByKey.has(invoiceKey)) {
				summariesByKey.set(invoiceKey, extractSummary(row));
			}
		}
	}

	const summariesByInvoiceId = new Map<string, InvoiceElectronicSummary>();
	for (const invoice of invoicesToResolve) {
		const summary = summariesByKey.get(
			toInvoiceKey(invoice.series, invoice.correlative),
		);
		if (summary) {
			summariesByInvoiceId.set(invoice.id, summary);
		}
	}

	return summariesByInvoiceId;
}
