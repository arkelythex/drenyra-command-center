/**
 * LedgerQuery Domain Types
 *
 * Tipos para la capa de consulta al Libro Mayor (Ledger).
 * Abstrae la fuente de datos: API HTTP → DB directa (fallback).
 */

/** Una línea del libro mayor. */
export interface LedgerEntry {
	id: string;
	companyId: string;
	accountCode: string;
	accountName: string;
	debitCents: number;
	creditCents: number;
	entryDate: string; // ISO date
	period: string; // YYYY-MM
	voucherNumber?: string;
	description?: string;
	counterpartyRuc?: string;
	counterpartyName?: string;
}

/** Balance de una cuenta a una fecha. */
export interface AccountBalance {
	accountCode: string;
	accountName: string;
	debitBalanceCents: number;
	creditBalanceCents: number;
	netBalanceCents: number;
}

/** Entrada inter-compañía. */
export interface InterCompanyEntry {
	entryId: string;
	sourceCompanyId: string;
	targetCompanyId: string;
	accountCode: string;
	amountCents: number;
	period: string;
}

/** LedgerQuery interface — contrato para consultar el libro mayor. */
export interface LedgerQuery {
	getEntries(
		companyId: string,
		startDate: string,
		endDate: string,
		accountCode?: string,
	): Promise<LedgerEntry[]>;

	getAccountBalances(
		companyId: string,
		asOfDate: string,
	): Promise<AccountBalance[]>;

	getInterCompanyEntries(
		sourceCompanyId: string,
		targetCompanyId: string,
		startDate: string,
		endDate: string,
	): Promise<InterCompanyEntry[]>;

	healthCheck(): Promise<boolean>;
}

/** Error cuando el Ledger no está disponible. */
export class LedgerUnavailableError extends Error {
	constructor(message = "Ledger service unavailable") {
		super(message);
		this.name = "LedgerUnavailableError";
	}
}
