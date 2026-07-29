/**
 * MFA Routes — Elysia endpoints for TOTP-based MFA.
 *
 * Endpoints:
 * - POST /api/auth/mfa/enroll       — Initiate TOTP enrollment
 * - POST /api/auth/mfa/verify-enroll — Complete enrollment with TOTP code
 * - POST /api/auth/mfa/verify       — Verify TOTP code during login challenge
 * - POST /api/auth/mfa/recover      — Redeem a recovery code
 * - POST /api/auth/mfa/disable      — Disable MFA
 *
 * @module auth/mfa/routes
 */

import { Elysia, t } from "elysia";
import {
	initiateEnrollment,
	completeEnrollment,
	verifyMfaChallenge,
	redeemRecoveryCode,
	disableMfa,
	MfaNotAvailableError,
	MfaAlreadyEnabledError,
	MfaNotEnabledError,
	MfaEnrollmentNotStartedError,
	InvalidTotpCodeError,
} from "@drenyra/security/mfa";
import { createMfaDbAdapter } from "./mfa-db-adapter";
import { createLogger } from "../../../lib/logger";

const logger = createLogger({ feature: "auth", handler: "mfa-routes" });
const mfaDb = createMfaDbAdapter();

/** Extract authenticated user ID from session/context. */
async function getAuthenticatedUserId(ctx: {
	request: Request;
	set: { status: number };
}): Promise<string | null> {
	// Read session from BetterAuth cookie
	const cookieHeader = ctx.request.headers.get("cookie") ?? "";
	const sessionToken = extractSessionToken(cookieHeader);

	if (!sessionToken) {
		ctx.set.status = 401;
		return null;
	}

	// Query the session to get user ID
	// This is handled by the BetterAuth context — for now we read from
	// the auth handler's session resolution
	const { auth } = await import("../auth.config");
	const session = await auth.api.getSession({
		headers: ctx.request.headers as HeadersInit,
	});

	if (!session?.user?.id) {
		ctx.set.status = 401;
		return null;
	}

	return session.user.id;
}

function extractSessionToken(cookieHeader: string): string | null {
	const cookies = cookieHeader.split(";").map((c) => c.trim());
	for (const cookie of cookies) {
		const [name, ...valueParts] = cookie.split("=");
		if (name?.trim() === "better-auth.session_token") {
			return valueParts.join("=") || null;
		}
	}
	return null;
}

export const mfaRoutes = new Elysia({ prefix: "/api/auth/mfa" })
	// ── Initiate enrollment ──
	.post("/enroll", async (ctx) => {
		const userId = await getAuthenticatedUserId(ctx);
		if (!userId) return { error: "No autenticado" };

		try {
			const user = await mfaDb.findUserById(userId);
			if (!user) {
				ctx.set.status = 404;
				return { error: "Usuario no encontrado" };
			}

			const result = await initiateEnrollment(user, mfaDb);
			return {
				secret: result.secret,
				uri: result.uri,
			};
		} catch (error) {
			if (error instanceof MfaNotAvailableError) {
				ctx.set.status = 503;
				return { error: error.message };
			}
			if (error instanceof MfaAlreadyEnabledError) {
				ctx.set.status = 409;
				return { error: error.message };
			}
			logger.error({ error }, "MFA enrollment initiation failed");
			ctx.set.status = 500;
			return { error: "Error interno del servidor" };
		}
	})

	// ── Complete enrollment ──
	.post(
		"/verify-enroll",
		async (ctx) => {
			const userId = await getAuthenticatedUserId(ctx);
			if (!userId) return { error: "No autenticado" };

			const { code } = ctx.body as { code: string };

			try {
				const user = await mfaDb.findUserById(userId);
				if (!user) {
					ctx.set.status = 404;
					return { error: "Usuario no encontrado" };
				}

				const result = await completeEnrollment(user, code, mfaDb);
				return {
					success: true,
					recoveryCodes: result.recoveryCodes,
				};
			} catch (error) {
				if (error instanceof InvalidTotpCodeError) {
					ctx.set.status = 400;
					return { error: error.message };
				}
				if (error instanceof MfaEnrollmentNotStartedError) {
					ctx.set.status = 400;
					return { error: error.message };
				}
				logger.error({ error }, "MFA enrollment verification failed");
				ctx.set.status = 500;
				return { error: "Error interno del servidor" };
			}
		},
		{
			body: t.Object({
				code: t.String({ minLength: 6, maxLength: 6 }),
			}),
		},
	)

	// ── Verify TOTP during login challenge ──
	.post(
		"/verify",
		async (ctx) => {
			const userId = await getAuthenticatedUserId(ctx);
			if (!userId) return { error: "No autenticado" };

			const { code } = ctx.body as { code: string };

			try {
				const user = await mfaDb.findUserById(userId);
				if (!user) {
					ctx.set.status = 404;
					return { error: "Usuario no encontrado" };
				}

				const result = await verifyMfaChallenge(user, code, mfaDb);

				if (result.locked) {
					ctx.set.status = 429;
					return {
						error: "Demasiados intentos fallidos. Vuelva a iniciar sesión.",
						locked: true,
					};
				}

				if (!result.success) {
					ctx.set.status = 400;
					return {
						error: "Código TOTP inválido",
						failureCount: result.failureCount,
					};
				}

				return { success: true };
			} catch (error) {
				logger.error({ error }, "MFA verification failed");
				ctx.set.status = 500;
				return { error: "Error interno del servidor" };
			}
		},
		{
			body: t.Object({
				code: t.String({ minLength: 6, maxLength: 6 }),
			}),
		},
	)

	// ── Redeem recovery code ──
	.post(
		"/recover",
		async (ctx) => {
			const userId = await getAuthenticatedUserId(ctx);
			if (!userId) return { error: "No autenticado" };

			const { code } = ctx.body as { code: string };

			try {
				const user = await mfaDb.findUserById(userId);
				if (!user) {
					ctx.set.status = 404;
					return { error: "Usuario no encontrado" };
				}

				const success = await redeemRecoveryCode(user, code, mfaDb);
				if (!success) {
					ctx.set.status = 400;
					return { error: "Código de recuperación inválido o ya utilizado" };
				}

				return { success: true };
			} catch (error) {
				logger.error({ error }, "Recovery code redemption failed");
				ctx.set.status = 500;
				return { error: "Error interno del servidor" };
			}
		},
		{
			body: t.Object({
				code: t.String({ minLength: 1 }),
			}),
		},
	)

	// ── Disable MFA ──
	.post("/disable", async (ctx) => {
		const userId = await getAuthenticatedUserId(ctx);
		if (!userId) return { error: "No autenticado" };

		try {
			const user = await mfaDb.findUserById(userId);
			if (!user) {
				ctx.set.status = 404;
				return { error: "Usuario no encontrado" };
			}

			await disableMfa(user, mfaDb);
			return { success: true };
		} catch (error) {
			if (error instanceof MfaNotEnabledError) {
				ctx.set.status = 400;
				return { error: error.message };
			}
			logger.error({ error }, "MFA disable failed");
			ctx.set.status = 500;
			return { error: "Error interno del servidor" };
		}
	});
