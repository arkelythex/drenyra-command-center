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
		const { eq, and, gte, lte } = await import("@drenyra/persistence/query");

		const conditions = [
			eq(db.ledgerEntries.companyId, companyId),
			gte(db.ledgerEntries.entryDate, startDate),
			lte(db.ledgerEntries.entryDate, endDate),
		];
		if (accountCode) conditions.push(eq(db.ledgerEntries.accountCode, accountCode));

		return (await db.query.ledgerEntries.findMany({
			where: and(...conditions),
		})) as LedgerEntry[];
	}

	async getAccountBalances(
		companyId: string,
		asOfDate: string,
	): Promise<AccountBalance[]> {
		const { db } = await import("@drenyra/persistence/client");

		return (await db.query.ledgerEntries.findMany({
			where: (t: any, { eq }: any) => eq(t.companyId, companyId),
			columns: {
				accountCode: true,
				accountName: true,
			},
		})) as AccountBalance[];
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
