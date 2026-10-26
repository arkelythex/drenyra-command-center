import type { Invoice } from "../hooks/useInvoices";

export interface AgingBuckets {
	current: number;
	d1to30: number;
	d31to60: number;
	d61plus: number;
	total: number;
}

export interface AgingRow extends AgingBuckets {
	customer: string;
}

export interface AgingReport {
	rows: AgingRow[];
	totals: AgingBuckets;
	/** Unpaid invoices in a currency other than PEN, left out of the sums. */
	excludedForeignCurrency: number;
}

type AgingInvoice = Pick<
	Invoice,
	"customer" | "dueDate" | "amount" | "status" | "currency"
> &
	Partial<Pick<Invoice, "totalAmount">>;

const DAY_MS = 86_400_000;

function utcDay(value: string | Date): number {
	const d = typeof value === "string" ? new Date(value) : value;
	return Math.floor(d.getTime() / DAY_MS);
}

const emptyBuckets = (): AgingBuckets => ({
	current: 0,
	d1to30: 0,
	d31to60: 0,
	d61plus: 0,
	total: 0,
});

function bucketFor(daysPastDue: number): keyof Omit<AgingBuckets, "total"> {
	if (daysPastDue <= 0) return "current";
	if (daysPastDue <= 30) return "d1to30";
	if (daysPastDue <= 60) return "d31to60";
	return "d61plus";
}

function oldestBucketRank(row: AgingBuckets): number {
	if (row.d61plus > 0) return 3;
	if (row.d31to60 > 0) return 2;
	if (row.d1to30 > 0) return 1;
	return 0;
}

/**
 * Receivables aging from real invoices: unpaid (sent or overdue) amounts per
 * customer, bucketed by days past the due date. Drafts are not receivables.
 * Only PEN is summed; other currencies are counted, never converted.
 */
export function buildAging(
	invoices: AgingInvoice[],
	today: Date = new Date(),
): AgingReport {
	const todayDay = utcDay(today);
	const byCustomer = new Map<string, AgingRow>();
	const totals = emptyBuckets();
	let excludedForeignCurrency = 0;

	for (const invoice of invoices) {
		if (invoice.status !== "sent" && invoice.status !== "overdue") continue;
		if (invoice.currency !== "PEN") {
			excludedForeignCurrency += 1;
			continue;
		}

		const amount = invoice.totalAmount ?? invoice.amount;
		const bucket = bucketFor(todayDay - utcDay(invoice.dueDate));
		const row = byCustomer.get(invoice.customer.name) ?? {
			customer: invoice.customer.name,
			...emptyBuckets(),
		};
		row[bucket] += amount;
		row.total += amount;
		totals[bucket] += amount;
		totals.total += amount;
		byCustomer.set(row.customer, row);
	}

	const rows = [...byCustomer.values()].sort(
		(a, b) => oldestBucketRank(b) - oldestBucketRank(a) || b.total - a.total,
	);
	return { rows, totals, excludedForeignCurrency };
}
