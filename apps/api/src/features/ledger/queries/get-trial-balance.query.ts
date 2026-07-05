import { db as globalDb } from "@drenyra/persistence/client";
import { and, asc, eq, lte, sql } from "@drenyra/persistence/query";
import { categories, transactions } from "@drenyra/persistence/schema";
import {
	resolveAccountCode,
	type TransactionDirection,
	toNumber,
} from "../_internal/ledger-utils";

interface ChartAccountRow {
	categoryId: string | null;
	name: string | null;
	direction: TransactionDirection | null;
	activity: number;
	totalDebit: number;
	totalCredit: number;
}

/**
 * TrialBalanceAccount interface.
 *
 * @example
 * ```ts
 * const value: TrialBalanceAccount = {} as TrialBalanceAccount;
 * console.log(value);
 * ```
 */
export interface TrialBalanceAccount {
	code: string;
	name: string;
	debits: string;
	credits: string;
	balance: string;
	activity: number;
}

/**
 * TrialBalanceResult interface.
 *
 * @example
 * ```ts
 * const value: TrialBalanceResult = {} as TrialBalanceResult;
 * console.log(value);
 * ```
 */
export interface TrialBalanceResult {
	asOfDate: string;
	debits: string;
	credits: string;
	balance: string;
	accounts: TrialBalanceAccount[];
}

export async function getTrialBalance(
	companyId: string,
	asOfDate: Date,
): Promise<TrialBalanceResult> {
	const rows = await globalDb
		.select({
			categoryId: categories.id,
			name: categories.name,
			direction: categories.type,
			activity: sql<number>`COUNT(${transactions.id})::int`,
			totalDebit: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN CAST(${transactions.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
			totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN CAST(${transactions.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
		})
		.from(categories)
		.leftJoin(
			transactions,
			and(
				eq(transactions.companyId, companyId),
				eq(transactions.categoryId, categories.id),
				lte(transactions.issueDate, asOfDate),
			),
		)
		.where(eq(categories.companyId, companyId))
		.groupBy(categories.id, categories.name, categories.type)
		.orderBy(asc(categories.name));

	const accounts = rows
		.map((row, index) => mapTrialBalanceAccount(row as ChartAccountRow, index))
		.filter((row): row is TrialBalanceAccount => row !== null);

	const totals = accounts.reduce(
		(acc, account) => {
			acc.debits += toNumber(account.debits);
			acc.credits += toNumber(account.credits);
			return acc;
		},
		{ debits: 0, credits: 0 },
	);

	return {
		asOfDate: asOfDate.toISOString(),
		debits: totals.debits.toFixed(2),
		credits: totals.credits.toFixed(2),
		balance: (totals.debits - totals.credits).toFixed(2),
		accounts,
	};
}

function mapTrialBalanceAccount(
	row: ChartAccountRow,
	index: number,
): TrialBalanceAccount | null {
	if (!row.name) return null;

	const debits = toNumber(row.totalDebit);
	const credits = toNumber(row.totalCredit);

	return {
		code: resolveAccountCode(row.direction, index),
		name: row.name,
		debits: debits.toFixed(2),
		credits: credits.toFixed(2),
		balance: (debits - credits).toFixed(2),
		activity: Number(row.activity ?? 0),
	};
}
