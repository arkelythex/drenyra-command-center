import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins/custom-session";
import { db } from "@arkelythex/persistence/client";
import { authUsers, authSessions, authAccounts, authVerifications } from "@arkelythex/persistence/schema";
import { enrichSessionUserWithCompanyContext } from "./handlers/session-company-context";
import { resolveTrustedOriginsFromEnv } from "./lib/auth-trusted-origins";

/**
 * BetterAuth Configuration
 *
 * Centralized authentication configuration for ARKELYTHEX.
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
 * - Production: add app.arkelythexfounders.com
 *
 * @module auth/config
 * @constant
 *
 * @throws {ConfigurationError} If BETTER_AUTH_SECRET is missing or too short
 * @throws {ConfigurationError} If database connection fails
 *
 * @example
 * ```ts
 * // Used by auth handlers to process requests
 * import { auth } from './auth.config';
 *
 * const loginRequest = new Request('http://localhost:3000/api/auth/sign-in/email', {
 *   method: 'POST',
 *   body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
 * });
 *
 * const response = await auth.handler(loginRequest);
 * console.log(response.status); // 200 for success, 401 for invalid credentials
 * ```
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
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...authOptions,
  plugins: [
    customSession(
      async ({ user, session }) => ({
        session,
        user: (await enrichSessionUserWithCompanyContext(user)) ?? user,
      }),
      authOptions,
    ),
  ],
});
