/**
 * PrometeoAdapter
 *
 * Adapts the existing {@link PrometeoService} to the {@link BankProviderAdapter} interface.
 * Part of the Phase 1 provider abstraction layer.
 *
 * The original PrometeoService is marked @deprecated and kept for backward compatibility.
 * New code should use PrometeoAdapter via the BankProviderAdapter interface.
 *
 * @example
 * ```ts
 * const adapter = new PrometeoAdapter();
 * const session = await adapter.login({ username: 'user', password: 'x' });
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
import { PrometeoService } from "./prometeo.service";
import type { BankProvider } from "../domain/types";

// Determine the default provider from env or fallback
function getDefaultProvider(): BankProvider {
	const envProvider = process.env.PROMETEO_DEFAULT_PROVIDER?.trim();
	if (envProvider && isBankProvider(envProvider)) return envProvider;
	return "bcp_pers_pe";
}

function isBankProvider(value: string): value is BankProvider {
	const validProviders = [
		"bcp_pers_pe",
		"bcp_corp_pe",
		"interbank_pe",
		"bbva_pers_pe",
		"bbva_corp_pe",
		"scotia_pers_pe",
		"scotia_smes_pe",
	];
	return validProviders.includes(value);
}

export class PrometeoAdapter implements BankProviderAdapter {
	readonly providerCode = "PROMETEO";

	private readonly prometeoService: PrometeoService;
	private readonly defaultProvider: BankProvider;

	constructor(service?: PrometeoService) {
		this.prometeoService = service ?? new PrometeoService();
		this.defaultProvider = getDefaultProvider();
	}

	async login(credentials: RawCredentials): Promise<ProviderSession> {
		const sessionKey = await this.prometeoService.login({
			provider: this.defaultProvider,
			username: credentials.username,
			password: credentials.password,
			...(credentials.documentType && {
				documentType: credentials.documentType as
					| "dni"
					| "pasaporte"
					| "carne_extranjeria",
			}),
			...(credentials.documentNumber && {
				documentNumber: credentials.documentNumber,
			}),
			...(credentials.otpToken && { otpToken: credentials.otpToken }),
		});

		return {
			sessionKey,
			providerCode: this.providerCode,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		};
	}

	async getAccounts(session: ProviderSession): Promise<NormalizedAccount[]> {
		const accounts = await this.prometeoService.getAccounts(
			session.sessionKey,
			this.defaultProvider,
		);

		return accounts.map((a) => ({
			id: a.id,
			number: a.number,
			name: a.name,
			type: a.type,
			currency: a.currency,
			balance: a.balance,
		}));
	}

	async getMovements(
		session: ProviderSession,
		accountId: string,
		dateStart?: string,
		dateEnd?: string,
	): Promise<NormalizedMovement[]> {
		const movements = await this.prometeoService.getMovements(
			session.sessionKey,
			this.defaultProvider,
			accountId,
			dateStart,
			dateEnd,
		);

		return movements.map((m) => ({
			externalId: m.id,
			date: m.date,
			amount: m.credit ?? m.debit ?? 0,
			currency: m.currency as "PEN" | "USD" | "EUR",
			type: m.type,
			description: m.description,
			reference: m.reference,
		}));
	}

	async getBalances(
		session: ProviderSession,
		accountId: string,
	): Promise<AccountBalances> {
		// Prometeo API returns balance per account in the accounts list
		const accounts = await this.prometeoService.getAccounts(
			session.sessionKey,
			this.defaultProvider,
		);

		const account = accounts.find((a) => a.id === accountId);
		if (!account) {
			return { current: 0, available: 0 };
		}

		return {
			current: account.balance,
			available: account.balance,
		};
	}

	async logout(session: ProviderSession): Promise<void> {
		await this.prometeoService.logout(session.sessionKey);
	}
}
