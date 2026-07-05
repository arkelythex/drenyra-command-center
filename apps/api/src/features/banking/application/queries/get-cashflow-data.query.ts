import type { Currency } from "@drenyra/domain/value-objects/Money";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte } from "@drenyra/persistence/query";
import { bankTransactions } from "@drenyra/persistence/schema";

export interface GetCashflowDataInput {
	companyId: string;
	startDate: Date;
	endDate: Date;
	currency?: Currency;
	reconciledOnly?: boolean;
}

export interface DailyCashflow {
	date: string;
	inflows: number;
	outflows: number;
	net: number;
}

export interface CashflowDataResult {
	companyId: string;
	period: { startDate: Date; endDate: Date };
	currency: Currency;
	totalInflows: number;
	totalOutflows: number;
	netCashflow: number;
	transactionCount: { credits: number; debits: number };
	daily: DailyCashflow[];
}

type RawTransaction = {
	transactionDate: string;
	type: string;
	amount: string;
};

export async function getCashflowData(
	input: GetCashflowDataInput,
): Promise<CashflowDataResult> {
	const currency: Currency = input.currency ?? "PEN";
	const startStr = formatDate(input.startDate);
	const endStr = formatDate(input.endDate);

	const conditions = [
		eq(bankTransactions.companyId, input.companyId),
		gte(bankTransactions.transactionDate, startStr),
		lte(bankTransactions.transactionDate, endStr),
	];

	if (input.reconciledOnly === true) {
		conditions.push(eq(bankTransactions.isReconciled, true));
	}

	const rows = await db
		.select({
			transactionDate: bankTransactions.transactionDate,
			type: bankTransactions.type,
			amount: bankTransactions.amount,
		})
		.from(bankTransactions)
		.where(and(...conditions));

	const dailyMap = new Map<string, { inflows: number; outflows: number }>();
	let totalInflows = 0;
	let totalOutflows = 0;
	let credits = 0;
	let debits = 0;

	for (const row of rows as RawTransaction[]) {
		const amount = Math.round(parseFloat(row.amount) * 100) / 100;
		const day = row.transactionDate.slice(0, 10);

		if (!dailyMap.has(day)) {
			dailyMap.set(day, { inflows: 0, outflows: 0 });
		}

		const entry = dailyMap.get(day)!;

		if (row.type === "CREDIT") {
			totalInflows += amount;
			entry.inflows += amount;
			credits += 1;
		} else if (row.type === "DEBIT") {
			totalOutflows += amount;
			entry.outflows += amount;
			debits += 1;
		}
	}

	const daily: DailyCashflow[] = Array.from(dailyMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, values]) => ({
			date,
			inflows: roundCents(values.inflows),
			outflows: roundCents(values.outflows),
			net: roundCents(values.inflows - values.outflows),
		}));

	return {
		companyId: input.companyId,
		period: { startDate: input.startDate, endDate: input.endDate },
		currency,
		totalInflows: roundCents(totalInflows),
		totalOutflows: roundCents(totalOutflows),
		netCashflow: roundCents(totalInflows - totalOutflows),
		transactionCount: { credits, debits },
		daily,
	};
}

function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function roundCents(value: number): number {
	return Math.round(value * 100) / 100;
}
