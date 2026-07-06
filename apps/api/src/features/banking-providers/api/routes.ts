/**
 * Banking Providers API Routes
 *
 * Endpoints para integración con bancos via Prometeo API.
 *
 * FLUJO:
 * 1. POST /connect - Login → Session key (5 min TTL)
 * 2. GET /accounts - Obtener cuentas
 * 3. GET /movements - Obtener transacciones
 * 4. POST /disconnect - Logout
 *
 * @module banking-providers/api
 */

import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { fail, ok } from "../../shared/api-response";
import { ConnectBankCommand } from "../application/commands/connect-bank.command";
import { GetBankAccountsQuery } from "../application/queries/get-bank-accounts.query";
import { GetBankMovementsQuery } from "../application/queries/get-bank-movements.query";
import { PrometeoService } from "../infrastructure/prometeo.service";

const SESSION_KEY_HEADER = "x-prometeo-session-key";

const BankProviderSchema = t.Union([
	t.Literal("bcp_pers_pe"),
	t.Literal("bcp_corp_pe"),
	t.Literal("interbank_pe"),
	t.Literal("bbva_pers_pe"),
	t.Literal("bbva_corp_pe"),
	t.Literal("scotia_pers_pe"),
	t.Literal("scotia_smes_pe"),
]);

const DocumentTypeSchema = t.Union([
	t.Literal("dni"),
	t.Literal("pasaporte"),
	t.Literal("carne_extranjeria"),
]);

function mapBankingErrorToStatus(message: string): number {
	const normalized = message.toLowerCase();
	if (
		normalized.includes("invalid credentials") ||
		normalized.includes("unauthorized") ||
		normalized.includes("session expired") ||
		normalized.includes("authentication")
	) {
		return 401;
	}
	if (normalized.includes("rate limit")) return 429;
	if (normalized.includes("required") || normalized.includes("invalid"))
		return 400;
	return 502;
}

function getSessionKeyFromRequest(
	headers: Record<string, string | undefined>,
	querySessionKey?: string,
): string | null {
	const fromHeader = headers[SESSION_KEY_HEADER]?.trim();
	if (fromHeader) return fromHeader;

	const fromQuery = querySessionKey?.trim();
	if (fromQuery) return fromQuery;

	return null;
}

function validateProviderSpecificFields(input: {
	provider: string;
	documentType?: string;
	documentNumber?: string;
}): string | null {
	if (input.provider === "bcp_pers_pe") {
		if (!input.documentType || !input.documentNumber) {
			return "BCP Personal requiere documentType y documentNumber";
		}
	}

	if (
		(input.documentType && !input.documentNumber) ||
		(!input.documentType && input.documentNumber)
	) {
		return "documentType y documentNumber deben enviarse juntos";
	}

	return null;
}

/**
 * Banking Providers Routes
 * @example
 * ```ts
 * console.log(bankingProvidersRoutes);
 * ```
 */

export const bankingProvidersRoutes = new Elysia({
	prefix: "/api/banking-providers",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	/**
	 * POST /api/banking-providers/connect
	 *
	 * Conecta con banco via Prometeo (login)
	 * Retorna session key (expira en 5 min)
	 */
	.post(
		"/connect",
		async ({ body, set }) => {
			const validationError = validateProviderSpecificFields({
				provider: body.provider,
				documentType: body.documentType,
				documentNumber: body.documentNumber,
			});
			if (validationError) {
				set.status = 400;
				return fail(validationError, "VALIDATION_ERROR");
			}

			try {
				const command = new ConnectBankCommand();
				const result = await command.execute({
					credentials: {
						provider: body.provider,
						username: body.username,
						password: body.password,
						documentType: body.documentType,
						documentNumber: body.documentNumber,
						otpToken: body.otpToken,
					},
				});

				set.status = 201;
				return ok(result);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to connect to bank";
				set.status = mapBankingErrorToStatus(message);
				return fail(message, "BANK_CONNECTION_ERROR");
			}
		},
		{
			body: t.Object({
				provider: BankProviderSchema,
				username: t.String({ minLength: 1 }), // Número de tarjeta
				password: t.String({ pattern: "^[0-9]{6}$" }), // Clave de internet (6 dígitos)
				documentType: t.Optional(DocumentTypeSchema),
				documentNumber: t.Optional(t.String()),
				otpToken: t.Optional(t.String()), // OTP para Scotiabank, etc.
			}),
			detail: {
				summary: "Connect to bank via Prometeo",
				description: `
Autentica usuario con banco y retorna session key temporal.

**Providers soportados:**
- BCP Personal: \`bcp_pers_pe\` (requiere documentType y documentNumber)
- BCP Corporativo: \`bcp_corp_pe\`
- Interbank: \`interbank_pe\`
- BBVA Personal/Corp: \`bbva_pers_pe\`, \`bbva_corp_pe\`
- Scotiabank: \`scotia_pers_pe\`, \`scotia_smes_pe\` (puede requerir otpToken)

**IMPORTANTE:**
- Session key expira en 5 minutos
- NUNCA almacenar credenciales bancarias
- Usar session key para /accounts y /movements
        `,
				tags: ["Banking Providers"],
			},
		},
	)

	/**
	 * GET /api/banking-providers/accounts
	 *
	 * Obtener cuentas bancarias
	 */
	.get(
		"/accounts",
		async ({ query, headers, set }) => {
			const sessionKey = getSessionKeyFromRequest(headers, query.sessionKey);
			if (!sessionKey) {
				set.status = 400;
				return fail("Session key requerida", "SESSION_KEY_REQUIRED");
			}

			try {
				const queryHandler = new GetBankAccountsQuery();
				const accounts = await queryHandler.execute({
					sessionKey,
					provider: query.provider,
				});

				return ok({ accounts });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to fetch accounts";
				set.status = mapBankingErrorToStatus(message);
				return fail(message, "ACCOUNTS_FETCH_ERROR");
			}
		},
		{
			query: t.Object({
				sessionKey: t.Optional(t.String({ minLength: 1 })), // Legacy fallback
				provider: BankProviderSchema,
			}),
			detail: {
				summary: "Get bank accounts",
				description: `
Retorna lista de cuentas bancarias del usuario.

**Headers requeridos:**
- \`x-prometeo-session-key\`: Session key de /connect (expira en 5 min)

**Respuesta:**
- Lista de cuentas con balance, tipo, moneda
        `,
				tags: ["Banking Providers"],
			},
		},
	)

	/**
	 * GET /api/banking-providers/movements
	 *
	 * Obtener movimientos/transacciones
	 */
	.get(
		"/movements",
		async ({ query, headers, set }) => {
			const sessionKey = getSessionKeyFromRequest(headers, query.sessionKey);
			if (!sessionKey) {
				set.status = 400;
				return fail("Session key requerida", "SESSION_KEY_REQUIRED");
			}

			try {
				const queryHandler = new GetBankMovementsQuery();
				const movements = await queryHandler.execute({
					sessionKey,
					provider: query.provider,
					accountId: query.accountId,
					dateStart: query.dateStart,
					dateEnd: query.dateEnd,
				});

				return ok({ movements });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to fetch movements";
				set.status = mapBankingErrorToStatus(message);
				return fail(message, "MOVEMENTS_FETCH_ERROR");
			}
		},
		{
			query: t.Object({
				sessionKey: t.Optional(t.String({ minLength: 1 })), // Legacy fallback
				provider: BankProviderSchema,
				accountId: t.String({ minLength: 1 }),
				dateStart: t.Optional(t.String({ format: "date" })), // YYYY-MM-DD
				dateEnd: t.Optional(t.String({ format: "date" })),
			}),
			detail: {
				summary: "Get account movements/transactions",
				description: `
Retorna movimientos/transacciones de una cuenta.

**Filtros:**
- \`dateStart\`: Fecha inicio (YYYY-MM-DD)
- \`dateEnd\`: Fecha fin (YYYY-MM-DD)

**Respuesta:**
- Lista de movimientos con fecha, descripción, monto, balance
        `,
				tags: ["Banking Providers"],
			},
		},
	)

	/**
	 * POST /api/banking-providers/disconnect
	 *
	 * Desconectar sesión Prometeo (logout)
	 */
	.post(
		"/disconnect",
		async ({ body, headers }) => {
			const sessionKey = getSessionKeyFromRequest(headers, body.sessionKey);
			if (!sessionKey) {
				return fail("Session key requerida", "SESSION_KEY_REQUIRED");
			}

			try {
				const prometeoService = new PrometeoService();
				await prometeoService.logout(sessionKey);

				return ok({ disconnected: true });
			} catch (_error) {
				// Ignore logout errors (session may have expired)
				return ok({ disconnected: true });
			}
		},
		{
			body: t.Object({
				sessionKey: t.Optional(t.String({ minLength: 1 })),
			}),
			detail: {
				summary: "Disconnect from bank (logout)",
				description: `
Invalida session key de Prometeo.

**NOTA:** Session keys expiran automáticamente en 5 min, logout es opcional.
        `,
				tags: ["Banking Providers"],
			},
		},
	);
