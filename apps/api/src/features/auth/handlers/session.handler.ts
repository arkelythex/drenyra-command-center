import { Context } from 'elysia';
import { createLogger } from '../../../lib/logger';
import { auth } from '../auth.config';
import { ok, fail } from '../../shared/api-response';
import { pickHeadersForAuthSubrequest } from '../lib/auth-internal-request-headers';
import { forwardSetCookiesFromHeaders } from '../lib/forward-upstream-set-cookies';
import { enrichSessionUserWithCompanyContext } from './session-company-context';

const logger = createLogger({ feature: 'auth', handler: 'session' });

function isAlreadyEnrichedUser(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as {
    legacyUserId?: unknown;
    availableCompanies?: unknown;
    activeCompanyId?: unknown;
  };

  return (
    typeof candidate.legacyUserId === 'string' ||
    typeof candidate.activeCompanyId === 'string' ||
    Array.isArray(candidate.availableCompanies)
  );
}

/**
 * Session and Logout Handlers
 *
 * Manages user session lifecycle: logout and session retrieval.
 * Uses BetterAuth session management with HTTP-only cookies.
 *
 * **Security Model:**
 * - Sessions stored in HTTP-only cookies (prevents XSS attacks)
 * - Session tokens are cryptographically signed
 * - Logout invalidates server-side session immediately
 * - Session retrieval validates cookie signature on every request
 *
 * @module auth/handlers/session
 * Logout user by invalidating session.
 *
 * Calls BetterAuth `/api/auth/sign-out` which:
 * 1. Deletes session from database
 * 2. Clears HTTP-only session cookie
 * 3. Prevents session reuse (token invalidation)
 *
 * **Security Notes:**
 * - Idempotent: calling logout on expired session returns success
 * - Client-side: must clear any cached user data after logout
 * - Server-side: session is immediately invalidated (no grace period)
 *
 * @param context - Elysia request context (provides headers with session cookie)
 * @returns Success message or error response
 *
 * @throws {UnauthorizedError} HTTP 401 - No active session (cookie missing or expired)
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Successful logout
 * const res = await handleLogout({
 *   headers: { cookie: 'session=abc123...' },
 *   set: { status: 200 }
 * } as Context);
 * console.log(res.message); // "Sesión cerrada exitosamente"
 * ```
 *
 * @example
 * ```ts
 * // Failed logout (no session)
 * const res = await handleLogout({
 *   headers: {},
 *   set: { status: 401 }
 * } as Context);
 * console.log(res.error); // "Error al cerrar sesión"
 * ```
 */

export async function handleLogout(context: Context): Promise<unknown> {
  const { headers, set, request } = context;

  try {
    const logoutRequest = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/sign-out`,
      {
        method: 'POST',
        headers: pickHeadersForAuthSubrequest(headers, {
          'content-type': 'application/json',
        }, request),
      }
    );

    const response = await auth.handler(logoutRequest);
    forwardSetCookiesFromHeaders(response.headers, set);

    if (response.status !== 200) {
      set.status = response.status;
      return fail('Error al cerrar sesión', 'LOGOUT_ERROR');
    }

    return ok({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    logger.error({ error }, 'Logout handler failed');
    set.status = 500;
    return fail('Error interno del servidor', 'INTERNAL_ERROR');
  }
}

/**
 * Get current session and user data.
 *
 * Retrieves active session from HTTP-only cookie and returns user + session data.
 * Used by frontend to check authentication status on page load.
 *
 * **Session Data Includes:**
 * - session.id - Session identifier
 * - session.expiresAt - ISO timestamp of expiration
 * - user.id - User identifier
 * - user.email - User email
 * - user.name - User name
 * - user.emailVerified - Boolean (user must verify email to login)
 *
 * **Security Notes:**
 * - NEVER returns password hash or sensitive fields
 * - Returns null session/user if cookie is missing or expired
 * - Session validation happens on every request (no client-side caching)
 *
 * @param context - Elysia request context (provides headers with session cookie)
 * @returns Session and user objects, or null for both if no active session
 *
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Active session
 * const res = await handleGetSession({
 *   headers: { cookie: 'session=abc123...' },
 *   set: { status: 200 }
 * } as Context);
 * console.log(res.user.email); // "user@example.com"
 * console.log(res.session.expiresAt); // "2026-02-10T12:00:00Z"
 * ```
 *
 * @example
 * ```ts
 * // No active session
 * const res = await handleGetSession({
 *   headers: {},
 *   set: { status: 200 }
 * } as Context);
 * console.log(res.session); // null
 * console.log(res.user); // null
 * ```
 */
export async function handleGetSession(context: Context): Promise<unknown> {
  const { headers, set, request: incomingRequest } = context;

  try {
    const getSessionRequest = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/get-session`,
      {
        method: 'GET',
        headers: pickHeadersForAuthSubrequest(headers, undefined, incomingRequest),
      }
    );

    const response = await auth.handler(getSessionRequest);
    const result = (await response.json().catch(() => null)) as
      | { session?: unknown; user?: unknown }
      | null;

    if (response.status !== 200) {
      if (response.status >= 500) {
        const hint = await response.clone().text().catch(() => '');
        logger.error(
          { status: response.status, hint: hint.slice(0, 1200) },
          'Better Auth get-session returned 5xx (check DATABASE_URL, migrations, BETTER_AUTH_SECRET)',
        );
        set.status = 200;
        return ok({ session: null, user: null });
      }
      set.status = 200;
      return ok({ session: null, user: null });
    }

    if (!result?.session || !result?.user) {
      return ok({ session: null, user: null });
    }

    const enrichedUser = isAlreadyEnrichedUser(result.user)
      ? result.user
      : await enrichSessionUserWithCompanyContext(result.user);

    return ok({ session: result.session, user: enrichedUser });
  } catch (error) {
    logger.error({ error }, 'Get session handler failed');
    set.status = 200;
    return ok({ session: null, user: null });
  }
}
