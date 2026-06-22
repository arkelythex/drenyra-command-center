import { Elysia } from 'elysia';
import { auth } from './auth.config';

function isDev(): boolean {
  return (process.env.NODE_ENV ?? 'development') !== 'production';
}

function buildDevAuthError(error: unknown): { message: string; hint?: string } {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  if (/BETTER_AUTH_SECRET/i.test(raw)) {
    return {
      message: 'Config inválida: falta `BETTER_AUTH_SECRET` (min 32 chars).',
      hint: 'Edita `apps/api/.env` y reinicia el API.',
    };
  }

  if (/ECONNREFUSED|connect ECONNREFUSED/i.test(raw)) {
    return {
      message: 'No se pudo conectar a PostgreSQL (ECONNREFUSED).',
      hint:
        'Inicia Postgres (por ejemplo: `docker compose up -d postgres`) y verifica `DATABASE_URL`.',
    };
  }

  if (/relation .* does not exist/i.test(raw)) {
    return {
      message: 'La base de datos no tiene tablas/migraciones (relation does not exist).',
      hint: 'Ejecuta Drizzle: `bun run --filter @arkelythex/infrastructure db:push`.',
    };
  }

  return {
    message: 'Error interno en Auth (HTTP 500). Revisa logs del API.',
    hint: raw,
  };
}

/**
 * Auth Module (Barrel Export)
 *
 * BetterAuth integration for authentication in ARKELYTHEX.
 * Mounts BetterAuth handler to process all auth-related requests.
 *
 * **Why .mount() instead of custom routes:**
 * - BetterAuth handles session management internally
 * - Provides built-in CSRF protection
 * - Handles cookie signing and validation
 * - Supports OAuth providers (future: Google, Microsoft)
 * - Auto-generates routes for all auth operations
 *
 * **Routes Provided by BetterAuth:**
 * - POST /api/auth/sign-in/email - Login with email/password
 * - POST /api/auth/sign-up/email - Register with email/password
 * - POST /api/auth/sign-out - Logout (invalidate session)
 * - GET /api/auth/get-session - Get current session
 * - POST /api/auth/send-verification-email - Send verification email
 * - GET /api/auth/verify-email - Verify email with token
 * - POST /api/auth/forget-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 *
 * **Custom Wrapper Routes:**
 * For Spanish error messages and RUC validation, see:
 * - `auth.routes.ts` - Custom Elysia routes that wrap BetterAuth
 *
 * **Security:**
 * - Session cookies: HTTP-only, Secure in production
 * - CSRF protection: enabled by default
 * - Password hashing: bcrypt cost factor 10
 * - Token signing: BETTER_AUTH_SECRET
 *
 * @module auth
 * @constant
 *
 * @throws {ConfigurationError} If BETTER_AUTH_SECRET is missing
 * @throws {DatabaseError} If database connection fails
 *
 * @example
 * ```ts
 * // Mount auth module in main app
 * import { Elysia } from "elysia";
 * import { authModule } from "./features/auth";
 *
 * const app = new Elysia()
 *   .use(authModule)
 *   .listen(3000);
 * ```
 *
 * @example
 * ```ts
 * // Use custom routes for Spanish errors + RUC validation
 * import { Elysia } from "elysia";
 * import { authRoutes } from "./features/auth/auth.routes";
 *
 * const app = new Elysia()
 *   .use(authRoutes) // Recommended for ARKELYTHEX
 *   .listen(3000);
 * ```
 */
export const authModule = new Elysia({ prefix: '/api/auth' })
  .all('/*', async ({ request, set }) => {
    try {
      const res = await auth.handler(request);

      // If BetterAuth returns a 5xx response, return a friendlier JSON payload in dev.
      if (isDev() && res instanceof Response && res.status >= 500) {
        const hint = await res.clone().text().catch(() => "");
        set.status = 500;
        return {
          message: 'Error interno en Auth (HTTP 500). Revisa logs del API.',
          hint: hint ? hint.slice(0, 800) : undefined,
        };
      }

      return res;
    } catch (error) {
      set.status = 500;
      return isDev() ? buildDevAuthError(error) : { message: 'Internal server error' };
    }
  });
