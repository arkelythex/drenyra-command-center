/**
 * LedgerQuery Facade
 *
 * Implementación de la interfaz LedgerQuery.
 * Primero intenta via API HTTP al ledger service.
 * Si falla, usa DB directa como fallback.
 */

import type { AccountBalance, InterCompanyEntry, LedgerEntry, LedgerQuery } from "../domain/ledger-query.types";
import { LedgerUnavailableError } from "../domain/ledger-query.types";

const LEDGER_API_URL = process.env.LEDGER_API_URL ?? "http://localhost:3001/api";

// ── HTTP Client ────────────────────────────────────────────────────────────

class LedgerApiClient implements LedgerQuery {
	async getEntries(
		companyId: string,
		startDate: string,
		endDate: string,
		accountCode?: string,
	): Promise<LedgerEntry[]> {
		const params = new URLSearchParams({ companyId, startDate, endDate });
		if (accountCode) params.set("accountCode", accountCode);

		const res = await fetch(`${LEDGER_API_URL}/ledger/general?${params}`);
		if (!res.ok) throw new LedgerUnavailableError(`Ledger API: ${res.status}`);
		return res.json();
	}

	async getAccountBalances(
		companyId: string,
		asOfDate: string,
	): Promise<AccountBalance[]> {
		const res = await fetch(
			`${LEDGER_API_URL}/ledger/trial-balance?companyId=${companyId}&asOfDate=${asOfDate}`,
		);
		if (!res.ok) throw new LedgerUnavailableError(`Ledger API: ${res.status}`);
		return res.json();
	}

	async getInterCompanyEntries(
		sourceCompanyId: string,
		targetCompanyId: string,
		startDate: string,
		endDate: string,
	): Promise<InterCompanyEntry[]> {
		const res = await fetch(
			`${LEDGER_API_URL}/ledger/intercompany?sourceCompanyId=${sourceCompanyId}&targetCompanyId=${targetCompanyId}&startDate=${startDate}&endDate=${endDate}`,
		);
		if (!res.ok) throw new LedgerUnavailableError(`Ledger API: ${res.status}`);
		return res.json();
	}

	async healthCheck(): Promise<boolean> {
		try {
			const res = await fetch(`${LEDGER_API_URL}/health`);
			return res.ok;
		} catch {
			return false;
		}
	}
}

// ── DB Fallback ────────────────────────────────────────────────────────────

class LedgerDbFallback implements LedgerQuery {
	async getEntries(
		companyId: string,
		startDate: string,
		endDate: string,
		accountCode?: string,
	): Promise<LedgerEntry[]> {
		const { db } = await import("@drenyra/persistence/client");
		const { and, eq, gte, lte } = await import("@drenyra/persistence/query");
		const { journalEntries, journalEntryLines, pcgeAccounts } = await import(
			"@drenyra/persistence/schema"
		);

		const conditions = [
			eq(journalEntries.companyId, companyId),
			gte(journalEntries.date, new Date(startDate)),
			lte(journalEntries.date, new Date(endDate)),
		];
		if (accountCode) {
			conditions.push(eq(journalEntryLines.accountCode, accountCode));
		}

		const rows = await db
			.select({
				id: journalEntryLines.id,
				companyId: journalEntries.companyId,
				accountCode: journalEntryLines.accountCode,
				accountName: pcgeAccounts.name,
				debitCents: journalEntryLines.debitCents,
				creditCents: journalEntryLines.creditCents,
				entryDate: journalEntries.date,
				period: journalEntries.periodKey,
				description: journalEntryLines.description,
			})
			.from(journalEntryLines)
			.innerJoin(
				journalEntries,
				eq(journalEntryLines.journalEntryId, journalEntries.id),
			)
			.leftJoin(
				pcgeAccounts,
				and(
					eq(pcgeAccounts.companyId, journalEntries.companyId),
					eq(pcgeAccounts.code, journalEntryLines.accountCode),
				),
			)
			.where(and(...conditions));

		return rows.map((row) => ({
			id: row.id,
			companyId: row.companyId,
			accountCode: row.accountCode,
			accountName: row.accountName ?? "",
			debitCents: row.debitCents,
			creditCents: row.creditCents,
			entryDate: row.entryDate.toISOString(),
			period: row.period,
			description: row.description,
		}));
	}

	async getAccountBalances(
		companyId: string,
		asOfDate: string,
	): Promise<AccountBalance[]> {
		const { db } = await import("@drenyra/persistence/client");
		const { and, eq, lte, sql } = await import("@drenyra/persistence/query");
		const { journalEntries, journalEntryLines, pcgeAccounts } = await import(
			"@drenyra/persistence/schema"
		);

		const rows = await db
			.select({
				accountCode: journalEntryLines.accountCode,
				accountName: pcgeAccounts.name,
				debitBalanceCents: sql<number>`COALESCE(SUM(${journalEntryLines.debitCents}), 0)`,
				creditBalanceCents: sql<number>`COALESCE(SUM(${journalEntryLines.creditCents}), 0)`,
			})
			.from(journalEntryLines)
			.innerJoin(
				journalEntries,
				eq(journalEntryLines.journalEntryId, journalEntries.id),
			)
			.leftJoin(
				pcgeAccounts,
				and(
					eq(pcgeAccounts.companyId, journalEntries.companyId),
					eq(pcgeAccounts.code, journalEntryLines.accountCode),
				),
			)
			.where(
				and(
					eq(journalEntries.companyId, companyId),
					lte(journalEntries.date, new Date(asOfDate)),
				),
			)
			.groupBy(journalEntryLines.accountCode, pcgeAccounts.name);

		return rows.map((row) => ({
			accountCode: row.accountCode,
			accountName: row.accountName ?? "",
			debitBalanceCents: row.debitBalanceCents,
			creditBalanceCents: row.creditBalanceCents,
			netBalanceCents: row.debitBalanceCents - row.creditBalanceCents,
		}));
	}

	async getInterCompanyEntries(
		_sourceCompanyId: string,
		_targetCompanyId: string,
		_startDate: string,
		_endDate: string,
	): Promise<InterCompanyEntry[]> {
		// TODO: Implementar cuando haya tabla intercompany
		return [];
	}

	async healthCheck(): Promise<boolean> {
		try {
			const { db } = await import("@drenyra/persistence/client");
			await db.execute("SELECT 1");
			return true;
		} catch {
			return false;
		}
	}
}

// ── Factory ────────────────────────────────────────────────────────────────

export class LedgerQueryFactory {
	private apiClient: LedgerApiClient;
	private dbFallback: LedgerDbFallback;

	constructor() {
		this.apiClient = new LedgerApiClient();
		this.dbFallback = new LedgerDbFallback();
	}

	/** Devuelve el mejor LedgerQuery disponible. */
	async create(): Promise<LedgerQuery> {
		const apiHealthy = await this.apiClient.healthCheck();
		if (apiHealthy) return this.apiClient;

		console.warn("[LedgerQuery] API unavailable, falling back to DB");
		const dbHealthy = await this.dbFallback.healthCheck();
		if (dbHealthy) return this.dbFallback;

		throw new LedgerUnavailableError("Both Ledger API and DB fallback are unavailable");
	}
}
