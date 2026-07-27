/**
 * MockBankAdapter
 *
 * Deterministic mock bank provider adapter for development and testing.
 * Implements BankProviderAdapter with synthetic data — no external HTTP calls.
 *
 * @example
 * ```ts
 * const adapter = new MockBankAdapter();
 * const session = await adapter.login({ username: 'any', password: 'any' });
 * const accounts = await adapter.getAccounts(session);
 * ```
 */

import type {
	AccountBalances,
	BankProviderAdapter,
	NormalizedAccount,
	NormalizedMovement,
	ProviderSession,
	RawCredentials,
} from "@drenyra/domain/providers";

/**
 * Deterministic synthetic data configuration.
 */
export interface MockBankConfig {
	accountCount?: number;
	transactionCount?: number;
	seed?: number;
}

/**
 * Simple seeded pseudo-random number generator.
 */
class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	/** Returns a pseudo-random value 0..1 */
	next(): number {
		this.seed = (this.seed * 16807) % 2147483647;
		return (this.seed - 1) / 2147483646;
	}

	/** Returns a pseudo-random integer in [min, max] */
	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}

	/** Returns a pseudo-random float in [min, max) with 2 decimals */
	nextAmount(min: number, max: number): number {
		return Math.round((this.next() * (max - min) + min) * 100) / 100;
	}
}

const ACCOUNT_TEMPLATES = [
	{
		name: "Cuenta Principal",
		type: "CHECKING" as const,
		currency: "PEN" as const,
	},
	{
		name: "Cuenta Ahorros",
		type: "SAVINGS" as const,
		currency: "USD" as const,
	},
	{
		name: "Cuenta Detracciones",
		type: "DETRACTION" as const,
		currency: "PEN" as const,
	},
];

const DESCRIPTION_TEMPLATES = [
	"DEPÓSITO POR TRANSFERENCIA",
	"RETIRO POR VENTANILLA",
	"PAGO DE FACTURA",
	"ABONO DE SUELDO",
	"PAGO TARJETA CRÉDITO",
	"TRANSFERENCIA RECIBIDA",
	"COBRO DE RECIBO",
	"PAGO PROVEEDOR",
];

const REFERENCE_PREFIXES = ["REF", "TRN", "FAC", "RCB"];

export class MockBankAdapter implements BankProviderAdapter {
	readonly providerCode = "MOCK";

	private rng: SeededRandom;
	private readonly config: Required<MockBankConfig>;
	private sessions: Map<string, { createdAt: Date }> = new Map();

	constructor(config: MockBankConfig = {}) {
		this.config = {
			accountCount: config.accountCount ?? 3,
			transactionCount: config.transactionCount ?? 10,
			seed: config.seed ?? 42,
		};
		this.rng = new SeededRandom(this.config.seed);
	}

	/**
	 * Reset the RNG seed for reproducibility.
	 */
	seed(seed: number): void {
		this.config.seed = seed;
		this.rng = new SeededRandom(seed);
	}

	// ── BankProviderAdapter ─────────────────────────────────────────────────

	async login(_credentials: RawCredentials): Promise<ProviderSession> {
		const sessionKey = `mock-session-${this.rng.nextInt(1000, 9999)}`;
		this.sessions.set(sessionKey, { createdAt: new Date() });

		return {
			sessionKey,
			providerCode: this.providerCode,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		};
	}

	async getAccounts(_session: ProviderSession): Promise<NormalizedAccount[]> {
		const accounts: NormalizedAccount[] = [];

		for (let i = 0; i < this.config.accountCount; i++) {
			const idx = i % ACCOUNT_TEMPLATES.length;
			const template = ACCOUNT_TEMPLATES[idx];
			if (!template) continue;
			accounts.push({
				id: `mock-acc-${i + 1}`,
				number: `191-${this.rng.nextInt(1000000, 9999999)}`,
				name: template.name,
				type: template.type,
				currency: template.currency,
				balance: this.rng.nextAmount(1000, 100000),
			});
		}

		return accounts;
	}

	async getMovements(
		_session: ProviderSession,
		_accountId: string,
		_dateStart?: string,
		_dateEnd?: string,
	): Promise<NormalizedMovement[]> {
		const movements: NormalizedMovement[] = [];

		for (let i = 0; i < this.config.transactionCount; i++) {
			const isCredit = this.rng.next() > 0.4;
			const amount = this.rng.nextAmount(100, 5000);

			const descIdx = this.rng.nextInt(0, DESCRIPTION_TEMPLATES.length - 1);
			movements.push({
				externalId: `mock-mov-${_accountId}-${i + 1}`,
				date: `2026-0${this.rng.nextInt(1, 6)}-${String(this.rng.nextInt(1, 28)).padStart(2, "0")}`,
				amount,
				currency: "PEN",
				type: isCredit ? "CREDIT" : "DEBIT",
				description: DESCRIPTION_TEMPLATES[descIdx] ?? "MOVIMIENTO",
				reference: `${REFERENCE_PREFIXES[this.rng.nextInt(0, REFERENCE_PREFIXES.length - 1)]}-${this.rng.nextInt(1000, 9999)}`,
			});
		}

		return movements;
	}

	async getBalances(
		_session: ProviderSession,
		_accountId: string,
	): Promise<AccountBalances> {
		// Derive balance deterministically from accountId
		const balance = this.rng.nextAmount(5000, 50000);
		return {
			current: balance,
			available: balance * 0.95,
		};
	}

	async logout(_session: ProviderSession): Promise<void> {
		// No-op: mock sessions don't need actual logout
	}
}
