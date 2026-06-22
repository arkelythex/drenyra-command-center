import { Elysia, t } from "elysia";
import { forgetPassword } from "./application/commands/forget-password.command";
import { login } from "./application/commands/login.command";
import { logout } from "./application/commands/logout.command";
import { resetPassword } from "./application/commands/reset-password.command";
import { sendVerificationEmail } from "./application/commands/send-verification-email.command";
import { signup } from "./application/commands/signup.command";
import { verifyEmail } from "./application/commands/verify-email.command";
import { getSession } from "./application/queries/get-session.query";
import { auth } from "./auth.config";

function isDev(): boolean {
	return (process.env.NODE_ENV ?? "development") !== "production";
}

function buildDevAuthError(error: unknown): { message: string; hint?: string } {
	const raw =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: JSON.stringify(error);

	if (/BETTER_AUTH_SECRET/i.test(raw)) {
		return {
			message: "Config inválida: falta `BETTER_AUTH_SECRET` (min 32 chars).",
			hint: "Edita `apps/api/.env` y reinicia el API.",
		};
	}

	if (/ECONNREFUSED|connect ECONNREFUSED/i.test(raw)) {
		return {
			message: "No se pudo conectar a PostgreSQL (ECONNREFUSED).",
			hint: "Inicia Postgres y verifica `DATABASE_URL`.",
		};
	}

	if (/relation .* does not exist/i.test(raw)) {
		return {
			message: "La base de datos no tiene tablas/migraciones.",
			hint: "Ejecuta Drizzle (`db:push`) y reinicia el API.",
		};
	}

	return {
		message: "Error interno en Auth (HTTP 500). Revisa logs del API.",
		hint: raw,
	};
}

function getAuthBaseUrl(): string {
	return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

async function buildNativeAuthResponse(
	path: string,
	init: {
		method: string;
		headers?: Record<string, string | undefined>;
		body?: unknown;
	},
): Promise<Response> {
	return auth.handler(
		new Request(`${getAuthBaseUrl()}${path}`, {
			method: init.method,
			headers: {
				Accept: "application/json",
				...(init.body ? { "Content-Type": "application/json" } : {}),
				...init.headers,
			},
			...(init.body ? { body: JSON.stringify(init.body) } : {}),
		}),
	);
}

/**
 * Auth Routes (Modular Architecture)
 *
 * Defines all authentication endpoints for ARKELYTHEX.
 * Uses Elysia for routing + TypeBox for runtime validation.
 *
 * **Architecture Pattern:**
 * - Routes: define paths, validation schemas (this file)
 * - Handlers: business logic, error handling (separate files)
 * - Config: BetterAuth instance, database adapter (auth.config.ts)
 *
 * **Security Validations:**
 * - Email format: validated by TypeBox (format: 'email')
 * - Password length: min 8 chars (TypeBox minLength)
 * - RUC length: exactly 11 chars (TypeBox minLength + maxLength)
 * - Token presence: required fields (TypeBox validation)
 *
 * **Endpoints:**
 * - POST /api/auth/signup - Register with email/password/RUC
 * - POST /api/auth/login - Login with email/password
 * - POST /api/auth/logout - Invalidate session
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/send-verification-email - Resend verification
 * - GET /api/auth/verify-email - Verify email with token
 * - POST /api/auth/forget-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 * - ALL /api/auth/* - BetterAuth native routes (fallback)
 *
 * **Error Responses:**
 * All endpoints return consistent error format:
 * ```ts
 * { error: string, field?: string, details?: any }
 * ```
 *
 * @module auth/routes
 * @constant
 *
 * @example
 * ```ts
 * // Mount auth routes in main app
 * import { Elysia } from "elysia";
 * import { authRoutes } from "./features/auth/auth.routes";
 *
 * const app = new Elysia()
 *   .use(authRoutes)
 *   .listen(3000);
 * ```
 *
 * @example
 * ```ts
 * // Test signup endpoint
 * const res = await fetch('http://localhost:3000/api/auth/signup', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'SecureP@ss2026',
 *     name: 'Juan Pérez',
 *     ruc: '20123456789'
 *   })
 * });
 * console.log(await res.json());
 * // { success: true, message: "Cuenta creada...", user: {...} }
 * ```
 */

export const authRoutes = new Elysia({ prefix: "/api/auth" })
	// Signup
	.post("/signup", (ctx) => signup(ctx.body, ctx), {
		body: t.Object({
			email: t.String({ format: "email" }),
			password: t.String({ minLength: 8 }),
			name: t.String({ minLength: 2 }),
			ruc: t.String({ minLength: 11, maxLength: 11 }),
		}),
	})

	// Login
	.post("/login", (ctx) => login(ctx.body, ctx), {
		body: t.Object({
			email: t.String({ format: "email" }),
			password: t.String({ minLength: 1 }),
		}),
	})

	// Better Auth native sign-in (used by auth client in some flows)
	.post(
		"/sign-in/email",
		async ({ body, headers, set }) => {
			try {
				const response = await buildNativeAuthResponse(
					"/api/auth/sign-in/email",
					{
						method: "POST",
						headers,
						body,
					},
				);

				if (isDev() && response.status >= 500) {
					const hint = await response
						.clone()
						.text()
						.catch(() => "");
					set.status = 500;
					return {
						message: "Error interno en Auth (HTTP 500). Revisa logs del API.",
						hint: hint ? hint.slice(0, 800) : undefined,
					};
				}

				return response;
			} catch (error) {
				set.status = 500;
				return isDev()
					? buildDevAuthError(error)
					: { message: "Internal server error" };
			}
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 1 }),
			}),
		},
	)

	// Logout
	.post("/logout", (ctx) => logout(ctx))

	// Email Verification
	.post(
		"/send-verification-email",
		(ctx) => sendVerificationEmail(ctx.body, ctx),
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				callbackURL: t.String(),
			}),
		},
	)
	.get("/verify-email", (ctx) => verifyEmail(ctx.query, ctx), {
		query: t.Object({
			token: t.String(),
		}),
	})

	// Password Reset
	.post("/forget-password", (ctx) => forgetPassword(ctx.body, ctx), {
		body: t.Object({
			email: t.String({ format: "email" }),
			redirectTo: t.Optional(t.String()),
		}),
	})
	.post("/reset-password", (ctx) => resetPassword(ctx.body, ctx), {
		body: t.Object({
			token: t.String(),
			password: t.String({ minLength: 8 }),
		}),
	})

	// Session
	.get("/session", (ctx) => getSession(ctx))

	// BetterAuth Native Routes - mounted at root to handle standard BetterAuth paths
	.all("/*", async ({ request, set }) => {
		try {
			const response = await auth.handler(request);

			if (isDev() && response instanceof Response && response.status >= 500) {
				const hint = await response
					.clone()
					.text()
					.catch(() => "");
				set.status = 500;
				return {
					message: "Error interno en Auth (HTTP 500). Revisa logs del API.",
					hint: hint ? hint.slice(0, 800) : undefined,
				};
			}

			return response;
		} catch (error) {
			set.status = 500;
			return isDev()
				? buildDevAuthError(error)
				: { message: "Internal server error" };
		}
	});
