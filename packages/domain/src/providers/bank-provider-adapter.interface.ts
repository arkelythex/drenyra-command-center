/**
 * BankProviderAdapter Interface
 *
 * Port for external bank data provider integrations (Prometeo, Mock, etc.).
 * Follows Hexagonal Architecture: domain defines the contract,
 * infrastructure provides implementations.
 *
 * @example
 * ```ts
 * class PrometeoAdapter implements BankProviderAdapter {
 *   async login(credentials: ProviderCredentials): Promise<ProviderSession> { ... }
 * }
 * ```
 */

import type { Currency } from "../types/currency";

// ── Data Transfer Types ────────────────────────────────────────────────────

/**
 * Normalized bank account from any provider.
 */
export interface NormalizedAccount {
	id: string;
	number: string;
	name: string;
	type: "CHECKING" | "SAVINGS" | "CREDIT" | "DETRACTION";
	currency: Currency;
	balance: number;
}

/**
 * Normalized bank movement/transaction from any provider.
 */
export interface NormalizedMovement {
	externalId: string;
	date: string; // ISO date string
	valueDate?: string;
	amount: number;
	currency: Currency;
	type: "CREDIT" | "DEBIT";
	description: string;
	reference?: string;
}

/**
 * Account balances response.
 */
export interface AccountBalances {
	current: number;
	available: number;
}

/**
 * Provider session — short-lived session key with metadata.
 */
export interface ProviderSession {
	sessionKey: string;
	providerCode: string;
	expiresAt: Date;
}

/**
 * Raw provider credentials (NEVER persisted or logged).
 */
export interface RawCredentials {
	username: string;
	password: string;
	documentType?: string;
	documentNumber?: string;
	otpToken?: string;
}

// ── Error Types ────────────────────────────────────────────────────────────

/**
 * Structured error from a bank provider.
 */
export class ProviderError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly providerCode: string,
		public readonly statusCode?: number,
	) {
		super(message);
		this.name = "ProviderError";
	}
}

// ── Adapter Interface ──────────────────────────────────────────────────────

/**
 * Contract for bank data provider integrations.
 *
 * All implementations MUST:
 * - Handle credential decryption internally
 * - Map provider-specific response shapes to normalized types
 * - Throw {@link ProviderError} on known failures
 * - Support configurable base URLs (sandbox/production)
 *
 * @example
 * ```ts
 * const adapter: BankProviderAdapter = new PrometeoAdapter(httpClient, encryptionKey);
 * const session = await adapter.login(credentials);
 * const accounts = await adapter.getAccounts(session);
 * ```
 */
export interface BankProviderAdapter {
	/**
	 * Provider identifier code (e.g. "PROMETEO", "MOCK").
	 */
	readonly providerCode: string;

	/**
	 * Authenticate with the provider and return a short-lived session.
	 *
	 * @param credentials - Decrypted provider credentials.
	 * @returns A session with key and expiration.
	 * @throws {@link ProviderError} on authentication failure.
	 */
	login(credentials: RawCredentials): Promise<ProviderSession>;

	/**
	 * Fetch all bank accounts accessible with this session.
	 *
	 * @param session - Active provider session.
	 * @returns Normalized list of bank accounts.
	 * @throws {@link ProviderError} on fetch failure or expired session.
	 */
	getAccounts(session: ProviderSession): Promise<NormalizedAccount[]>;

	/**
	 * Fetch movements/transactions for a bank account.
	 *
	 * @param session - Active provider session.
	 * @param accountId - Provider-specific account identifier.
	 * @param dateStart - Optional start date filter (ISO string).
	 * @param dateEnd - Optional end date filter (ISO string).
	 * @returns Normalized list of movements.
	 * @throws {@link ProviderError} on fetch failure.
	 */
	getMovements(
		session: ProviderSession,
		accountId: string,
		dateStart?: string,
		dateEnd?: string,
	): Promise<NormalizedMovement[]>;

	/**
	 * Fetch current and available balances for an account.
	 *
	 * @param session - Active provider session.
	 * @param accountId - Provider-specific account identifier.
	 * @returns Current and available balances.
	 * @throws {@link ProviderError} on fetch failure.
	 */
	getBalances(
		session: ProviderSession,
		accountId: string,
	): Promise<AccountBalances>;

	/**
	 * End a provider session. Implementations SHOULD swallow errors
	 * (best-effort logout).
	 *
	 * @param session - Session to invalidate.
	 */
	logout(session: ProviderSession): Promise<void>;
}
