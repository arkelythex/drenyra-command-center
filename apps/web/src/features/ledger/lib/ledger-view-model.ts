import type {
	LedgerAccount,
	LedgerTransaction,
} from "../components/ledger-view/ledger-data";
import { LEDGER_ALL_ACCOUNTS_ID } from "./ledger-constants";

/** Shape returned by GET /ledger/accounts (inner `data`). */
export interface LedgerApiChartRow {
	code: string;
	name: string;
	type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";
	activity: number;
	totalDebit: string;
	totalCredit: string;
	balance: string;
}

/** Shape returned by GET /ledger/general (array items). */
export interface LedgerApiGlRow {
	id: string;
	date: string;
	voucher: string;
	glosa: string;
	cuenta: string;
	debe: number;
	haber: number;
	doc: string;
	bancarizado: boolean;
}

export function getCalendarMonthBounds(reference: Date = new Date()): {
	start: Date;
	end: Date;
} {
	const y = reference.getFullYear();
	const m = reference.getMonth();
	return {
		start: new Date(y, m, 1, 0, 0, 0, 0),
		end: new Date(y, m + 1, 0, 23, 59, 59, 999),
	};
}

export function toLedgerPeriodQueryKeys(
	start: Date,
	end: Date,
): { startKey: string; endKey: string } {
	return {
		startKey: start.toISOString().slice(0, 10),
		endKey: end.toISOString().slice(0, 10),
	};
}

export function formatLedgerDateForDisplay(iso: string): string {
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		const dd = String(d.getDate()).padStart(2, "0");
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		return `${dd}/${mm}`;
	} catch {
		return iso;
	}
}

export function mapChartRowsToSidebarAccounts(rows: unknown): LedgerAccount[] {
	if (!Array.isArray(rows)) return [];
	const out: LedgerAccount[] = [];
	for (const raw of rows) {
		if (!raw || typeof raw !== "object") continue;
		const row = raw as Partial<LedgerApiChartRow>;
		if (
			typeof row.code !== "string" ||
			typeof row.name !== "string" ||
			typeof row.activity !== "number"
		) {
			continue;
		}
		out.push({
			id: row.code,
			code: row.code,
			name: row.name,
			type: "ACCOUNT",
			activity: row.activity,
		});
	}
	return out;
}

export function mapGeneralLedgerRowsToTransactions(
	rows: unknown,
): LedgerTransaction[] {
	if (!Array.isArray(rows)) return [];
	const out: LedgerTransaction[] = [];
	for (const raw of rows) {
		if (!raw || typeof raw !== "object") continue;
		const row = raw as Partial<LedgerApiGlRow>;
		if (
			typeof row.id !== "string" ||
			typeof row.date !== "string" ||
			typeof row.voucher !== "string" ||
			typeof row.glosa !== "string" ||
			typeof row.cuenta !== "string" ||
			typeof row.debe !== "number" ||
			typeof row.haber !== "number" ||
			typeof row.doc !== "string"
		) {
			continue;
		}
		out.push({
			id: row.id,
			date: formatLedgerDateForDisplay(row.date),
			voucher: row.voucher,
			glosa: row.glosa,
			cuenta: row.cuenta,
			debe: row.debe,
			haber: row.haber,
			doc: row.doc,
			bancarizado: row.bancarizado === true,
		});
	}
	return out;
}

/**
 * Filtra por nombre de categoría (campo `cuenta` en API), alineado con LedgerService.
 * `categoryName === null` → sin filtro (todas las cuentas).
 */
export function filterTransactionsByCategoryName(
	transactions: LedgerTransaction[],
	categoryName: string | null,
): LedgerTransaction[] {
	if (categoryName === null) return transactions;
	return transactions.filter((t) => t.cuenta === categoryName);
}

export function buildLedgerSidebarAccounts(
	accounts: LedgerAccount[],
): LedgerAccount[] {
	const all: LedgerAccount = {
		id: LEDGER_ALL_ACCOUNTS_ID,
		code: "*",
		name: "Todas las cuentas",
		type: "ACCOUNT",
		activity: accounts.reduce((n, a) => n + a.activity, 0),
	};
	return [all, ...accounts];
}
