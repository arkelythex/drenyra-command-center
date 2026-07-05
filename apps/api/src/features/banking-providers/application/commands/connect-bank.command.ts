/**
 * Connect Bank Command
 *
 * Autentica usuario con banco via Prometeo y retorna session key.
 *
 * IMPORTANTE:
 * - Session key expira en 5 minutos
 * - Almacenar en Redis con TTL de 5 min
 * - NO almacenar credenciales bancarias
 *
 * @module banking-providers/application/commands
 */

import { createLogger } from "../../../../lib/logger";
import type { BankCredentials } from "../../domain/types";
import { PrometeoService } from "../../infrastructure/prometeo.service";

const logger = createLogger({
	module: "banking-providers/connect-bank-command",
});

/**
 * ConnectBankInput interface.
 *
 * @example
 * ```ts
 * const value: ConnectBankInput = {} as ConnectBankInput;
 * console.log(value);
 * ```
 */
export interface ConnectBankInput {
	credentials: BankCredentials;
}

/**
 * ConnectBankOutput interface.
 *
 * @example
 * ```ts
 * const value: ConnectBankOutput = {} as ConnectBankOutput;
 * console.log(value);
 * ```
 */
export interface ConnectBankOutput {
	sessionKey: string;
	provider: string;
	expiresIn: number; // Segundos (300 = 5 min)
}

/**
 * Connect Bank Command
 *
 * Conecta con banco via Prometeo, retorna session key temporal
 * @example
 * ```ts
 * const value = new ConnectBankCommand();
 * console.log(value);
 * ```
 */

export class ConnectBankCommand {
	private prometeoService: PrometeoService;

	constructor() {
		this.prometeoService = new PrometeoService();
	}

	async execute(input: ConnectBankInput): Promise<ConnectBankOutput> {
		// Login via Prometeo
		const sessionKey = await this.prometeoService.login(input.credentials);

		// Calculate expiration (5 min from now)
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

		// TODO: Almacenar session en Redis con TTL de 5 min usando un session-id interno.

		logger.info(
			{
				provider: input.credentials.provider,
				expiresAt: expiresAt.toISOString(),
			},
			"Created temporary bank session",
		);

		return {
			sessionKey,
			provider: input.credentials.provider,
			expiresIn: 300, // 5 minutos
		};
	}
}
