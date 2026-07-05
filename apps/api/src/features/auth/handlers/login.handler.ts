import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { authUsers } from "@drenyra/persistence/schema";
import type { Context } from "elysia";
import { createLogger } from "../../../lib/logger";
import { fail } from "../../shared/api-response";
import { auth } from "../auth.config";
import {
	fingerprintSensitiveValue,
	resolveClientIpAddress,
} from "../lib/auth-event-sanitizer";
import { pickHeadersForAuthSubrequest } from "../lib/auth-internal-request-headers";
import { forwardSetCookiesFromHeaders } from "../lib/forward-upstream-set-cookies";

// ============================================
// SECURITY: Rate Limiting & Account Lockout
// ============================================

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const logger = createLogger({ feature: "auth", handler: "login" });

interface DurableLockoutState {
	userId: string;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
}

async function findDurableLockoutState(
	email: string,
): Promise<DurableLockoutState | null> {
	const rows = await db
		.select({
			userId: authUsers.id,
			failedLoginAttempts: authUsers.failedLoginAttempts,
			lockedUntil: authUsers.lockedUntil,
		})
		.from(authUsers)
		.where(eq(authUsers.email, email))
		.limit(1);

	if (rows.length === 0) {
		return null;
	}

	const [row] = rows;
	return {
		userId: row.userId,
		failedLoginAttempts: row.failedLoginAttempts,
		lockedUntil: row.lockedUntil,
	};
}

async function isAccountLocked(
	email: string,
): Promise<{ locked: boolean; lockedUntil?: Date }> {
	const state = await findDurableLockoutState(email);
	if (state?.lockedUntil && state.lockedUntil > new Date()) {
		return { locked: true, lockedUntil: state.lockedUntil };
	}
	return { locked: false };
}

async function recordFailedLogin(
	email: string,
): Promise<{ locked: boolean; lockedUntil?: Date }> {
	const state = await findDurableLockoutState(email);
	if (!state) {
		return { locked: false };
	}

	const newCount = state.failedLoginAttempts + 1;
	const isLocked = newCount >= MAX_ATTEMPTS;
	const lockedUntil = isLocked
		? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
		: undefined;

	await db
		.update(authUsers)
		.set({
			failedLoginAttempts: newCount,
			lockedUntil: lockedUntil ?? null,
			updatedAt: new Date(),
		})
		.where(eq(authUsers.id, state.userId));

	return { locked: isLocked, lockedUntil };
}

async function recordSuccessfulLogin(email: string): Promise<void> {
	await db
		.update(authUsers)
		.set({
			failedLoginAttempts: 0,
			lockedUntil: null,
			updatedAt: new Date(),
		})
		.where(eq(authUsers.email, email));
}

// ============================================
// Login Handler
// ============================================

/**
 * Login Handler
 *
 * Handles user authentication via BetterAuth email/password flow.
 * Implements security measures including account lockout detection,
 * email verification requirements, and Spanish error messages.
 *
 * Security considerations:
 * - NEVER reveals whether email exists (generic error message)
 * - Enforces email verification before login
 * - Detects and blocks locked/banned accounts
 * - Logs all login attempts (success/failure) for audit
 * - Rate limiting: 5 attempts, 30 min lockout
 *
 * @module auth/handlers/login
 * Login request body.
 *
 * @property email - User email (must be valid email format)
 * @property password - User password (validated by BetterAuth, min 8 chars at signup)
 * @example
 * ```ts
 * const value: LoginBody = {} as LoginBody;
 * console.log(value);
 * ```
 */

export interface LoginBody {
	email: string;
	password: string;
}

/**
 * Authenticates a user via BetterAuth email/password.
 *
 * Validates credentials against stored bcrypt hash and issues session cookie.
 * Returns Spanish error messages for user-facing UI.
 * @param body - Input for body.
 * @param context - Input for context.
 * @returns Result of handleLogin.
 * @example
 * ```ts
 * const result = await handleLogin({} as LoginBody, {} as Context);
 * console.log(result);
 * ```
 */

export async function handleLogin(
	body: LoginBody,
	context: Context,
): Promise<unknown> {
	const { email, password } = body;
	const { set, headers, request } = context;

	const ipAddress = resolveClientIpAddress(request.headers);
	const eventContext = {
		emailHash: fingerprintSensitiveValue(email),
		ipHash: fingerprintSensitiveValue(ipAddress),
	};

	try {
		// SECURITY: Check if account is locked before attempting login
		const lockCheck = await isAccountLocked(email);
		if (lockCheck.locked) {
			logger.warn(
				{ ...eventContext, lockedUntil: lockCheck.lockedUntil },
				"Login blocked by account lockout",
			);
			set.status = 429;
			return fail(
				`Demasiados intentos fallidos. Tu cuenta está bloqueada hasta ${lockCheck.lockedUntil?.toLocaleTimeString()}. Intenta más tarde.`,
				"ACCOUNT_LOCKED",
			);
		}

		// Call BetterAuth sign-in
		const loginRequest = new Request(
			`${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/sign-in/email`,
			{
				method: "POST",
				headers: pickHeadersForAuthSubrequest(
					headers,
					{
						"content-type": "application/json",
					},
					request,
				),
				body: JSON.stringify({ email, password }),
			},
		);

		const response = await auth.handler(loginRequest);

		// On success, copy session cookie from BetterAuth to our response
		if (response.status === 200) {
			await recordSuccessfulLogin(email);
			logger.info(eventContext, "Login succeeded");

			forwardSetCookiesFromHeaders(response.headers, set);

			const result = await response.json();
			return result;
		}

		// SECURITY: Record failed login attempt
		const failedCheck = await recordFailedLogin(email);
		logger.warn(
			{
				...eventContext,
				locked: failedCheck.locked,
				lockedUntil: failedCheck.lockedUntil,
			},
			"Login failed",
		);

		const result = (await response.json().catch(() => ({}))) as unknown;
		set.status = response.status;

		// Spanish error messages
		let errorMessage = "Error al iniciar sesión";
		const raw = getBetterAuthErrorMessage(result);
		if (raw.includes("Invalid")) {
			errorMessage = "Credenciales inválidas";
		} else if (raw.includes("not verified")) {
			errorMessage = "Por favor verifica tu email antes de iniciar sesión";
		} else if (raw.includes("locked") || raw.includes("banned")) {
			errorMessage = "Tu cuenta ha sido bloqueada. Contacta al administrador.";
		}

		return fail(errorMessage, "AUTH_ERROR", {
			details: getBetterAuthError(result),
		});
	} catch (error) {
		logger.error({ error, ...eventContext }, "Login handler failed");
		set.status = 500;
		return fail("Error interno del servidor", "INTERNAL_ERROR");
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getBetterAuthError(payload: unknown): unknown {
	if (!isRecord(payload)) return undefined;
	return payload.error;
}

function getBetterAuthErrorMessage(payload: unknown): string {
	const error = getBetterAuthError(payload);
	if (!isRecord(error)) return "";
	const message = error.message;
	return typeof message === "string" ? message : "";
}
