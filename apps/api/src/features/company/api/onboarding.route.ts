import { Elysia, t } from "elysia";
import { createLogger } from "../../../lib/logger";
import { resolveSessionIdentityFromHeaders } from "../../auth/handlers/session-identity";
import { fail, ok } from "../../shared/api-response";
import { createCompanyForUser } from "../application/commands/create-company.command";

const logger = createLogger({ feature: "company", handler: "onboarding" });

const createCompanyBody = t.Object({
	ruc: t.String({ minLength: 11, maxLength: 11 }),
	businessName: t.String({ minLength: 1, maxLength: 255 }),
	tradeName: t.Optional(t.String({ maxLength: 255 })),
	address: t.Optional(t.String({ maxLength: 500 })),
});

const FAILURES = {
	RUC_INVALID: {
		status: 422,
		message: "El RUC no es válido: revisa el dígito verificador.",
		field: "ruc",
	},
	NAME_REQUIRED: {
		status: 422,
		message: "Escribe la razón social de la empresa.",
		field: "businessName",
	},
	RUC_TAKEN: {
		status: 409,
		message:
			"Esta empresa ya está registrada. Pide a su administrador que te invite.",
		field: "ruc",
	},
} as const;

/**
 * Onboarding: the signed-in user registers their company and becomes its
 * owner. Needs a session but no active company, since this is how the first
 * one is created.
 *
 * @example
 * ```ts
 * const app = new Elysia().use(onboardingRoutes);
 * // POST /api/onboarding/company { ruc, businessName, address? }
 * ```
 */
export const onboardingRoutes = new Elysia({ prefix: "/api/onboarding" }).post(
	"/company",
	async ({ body, headers, set }) => {
		const identity = await resolveSessionIdentityFromHeaders(
			headers as Record<string, string | undefined>,
		);
		if (!identity.authUserId) {
			set.status = 401;
			return fail(
				"Inicia sesión para registrar tu empresa.",
				"SESSION_REQUIRED",
			);
		}

		const result = await createCompanyForUser({
			authUserId: identity.authUserId,
			ruc: body.ruc,
			businessName: body.businessName,
			tradeName: body.tradeName,
			address: body.address,
		});
		if (!result.ok) {
			const failure = FAILURES[result.code];
			set.status = failure.status;
			return fail(failure.message, result.code, { field: failure.field });
		}

		logger.info(
			{ userId: identity.authUserId, companyId: result.company.companyId },
			"Company registered in onboarding",
		);
		set.status = 201;
		return ok(result.company);
	},
	{ body: createCompanyBody },
);
