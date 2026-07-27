import { db } from "@drenyra/persistence/client";
import {
	authAccounts,
	authSessions,
	authUsers,
	authVerifications,
} from "@drenyra/persistence/schema";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins/custom-session";
import { mfaPlugin } from "@drenyra/security";
import { enrichSessionUserWithCompanyContext } from "./handlers/session-company-context";
import { oauthAuditHooks } from "./lib/oauth-audit-hooks";
import { resolveSocialProvidersFromEnv } from "./lib/resolve-social-providers";
import { resolveTrustedOriginsFromEnv } from "./lib/auth-trusted-origins";

/**
 * BetterAuth Configuration
 *
 * Centralized authentication configuration for DRENYRA.
 * Uses BetterAuth with Drizzle ORM adapter for PostgreSQL.
 *
 * **Security Configuration:**
 * - Secret: BETTER_AUTH_SECRET env var (used for signing tokens)
 * - Sessions: HTTP-only cookies with secure flag in production
 * - Password: bcrypt hashing with cost factor 10
 * - Email verification: required before login
 * - Custom fields: RUC (Peruvian business identifier)
 *
 * **Database Schema:**
 * - authUsers: user accounts (email, password hash, name, ruc, emailVerified)
 * - authSessions: active sessions (token, userId, expiresAt)
 * - authAccounts: OAuth providers (future: Google, Microsoft)
 * - authVerifications: email/password reset tokens
 *
 * **Environment Variables Required:**
 * - BETTER_AUTH_SECRET: Secret for signing tokens (min 32 chars)
 * - BETTER_AUTH_URL: Base URL for auth endpoints (e.g. http://localhost:3000)
 *
 * **Trusted Origins:**
 * - localhost:3000 (API server)
 * - localhost:5173 (Vite dev server for frontend)
 * - Production: add app.drenyrafounders.com
 *
 * @module auth/config
 * @constant
 */
const authOptions = {
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: authUsers,
			session: authSessions,
			account: authAccounts,
			verification: authVerifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: resolveSocialProvidersFromEnv(),
	databaseHooks: oauthAuditHooks,
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	trustedOrigins: resolveTrustedOriginsFromEnv(
		process.env.BETTER_AUTH_TRUSTED_ORIGINS,
	),
	user: {
		additionalFields: {
			ruc: {
				type: "string",
				required: false,
				defaultValue: "",
			},
			mfa_method: {
				type: "string",
				required: false,
				defaultValue: "",
			},
			totp_secret: {
				type: "string",
				required: false,
				defaultValue: "",
			},
			recovery_codes: {
				type: "string",
				required: false,
				defaultValue: "[]",
			},
		},
	},
} satisfies BetterAuthOptions;

export const auth = betterAuth({
	...authOptions,
	plugins: [
		mfaPlugin({ enforced: false }),
		customSession(
			async ({ user, session }) => ({
				session,
				user: (await enrichSessionUserWithCompanyContext(user)) ?? user,
			}),
			authOptions,
		),
	],
});
