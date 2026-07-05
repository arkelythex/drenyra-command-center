import { db as globalDb } from "@drenyra/persistence/client";
import { and, asc, eq, sql } from "@drenyra/persistence/query";
import { categories, transactions } from "@drenyra/persistence/schema";
import {
	resolveAccountCode,
	resolveAccountType,
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

const DEFAULT_CHART_OF_ACCOUNTS = [
	{ code: "1040", name: "Caja y bancos", type: "ASSET" as const, activity: 0 },
	{
		code: "1210",
		name: "Cuentas por cobrar comerciales",
		type: "ASSET" as const,
		activity: 0,
	},
	{
		code: "4011",
		name: "IGV por pagar",
		type: "LIABILITY" as const,
		activity: 0,
	},
	{
		code: "4210",
		name: "Cuentas por pagar comerciales",
		type: "LIABILITY" as const,
		activity: 0,
	},
	{ code: "7010", name: "Ventas", type: "REVENUE" as const, activity: 0 },
	{ code: "6010", name: "Compras", type: "EXPENSE" as const, activity: 0 },
];

export async function getChartOfAccounts(companyId: string): Promise<
	Array<{
		code: string;
		name: string;
		type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";
		activity: number;
		totalDebit: string;
		totalCredit: string;
		balance: string;
	}>
> {
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
			),
		)
		.where(eq(categories.companyId, companyId))
		.groupBy(categories.id, categories.name, categories.type)
		.orderBy(asc(categories.name));

	const mappedRows = rows
		.map((row, index) => mapChartAccountRow(row as ChartAccountRow, index))
		.filter((row): row is NonNullable<typeof row> => row !== null);

	if (mappedRows.length > 0) {
		return mappedRows;
	}

	return DEFAULT_CHART_OF_ACCOUNTS.map((account) => ({
		...account,
		totalDebit: "0.00",
		totalCredit: "0.00",
		balance: "0.00",
	}));
}

function mapChartAccountRow(
	row: ChartAccountRow,
	index: number,
): {
	code: string;
	name: string;
	type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";
	activity: number;
	totalDebit: string;
	totalCredit: string;
	balance: string;
} | null {
	if (!row.name) return null;

	const totalDebit = toNumber(row.totalDebit);
	const totalCredit = toNumber(row.totalCredit);
	const accountType = resolveAccountType(
		row.direction,
		totalDebit,
		totalCredit,
	);

	return {
		code: resolveAccountCode(row.direction, index),
		name: row.name,
		type: accountType,
		activity: Number(row.activity ?? 0),
		totalDebit: totalDebit.toFixed(2),
		totalCredit: totalCredit.toFixed(2),
		balance: (totalDebit - totalCredit).toFixed(2),
	};
}
