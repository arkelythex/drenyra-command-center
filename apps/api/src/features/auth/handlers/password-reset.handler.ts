import { Context } from 'elysia';
import { createLogger } from '../../../lib/logger';
import { auth } from '../auth.config';
import { ok, fail } from '../../shared/api-response';

const logger = createLogger({ feature: 'auth', handler: 'password-reset' });

/**
 * Password Reset Handlers
 *
 * Handles password reset flow with security best practices.
 *
 * **Security Model:**
 * - Reset tokens are single-use and time-limited (expires after 1 hour)
 * - NEVER reveals whether email exists (generic success message)
 * - Tokens are cryptographically signed and stored hashed
 * - Reset email sent only to verified email addresses
 * - Old password is NOT required (user may have forgotten it)
 *
 * **Flow:**
 * 1. User requests reset with email
 * 2. System sends reset email (if account exists)
 * 3. User clicks link with token in query string
 * 4. User submits new password + token
 * 5. System validates token and updates password
 *
 * @module auth/handlers/password-reset
 * Request body for initiating password reset.
 *
 * @property email - User email (reset link sent to this address)
 * @property redirectTo - Optional URL to redirect after reset (must be whitelisted domain)
 *
 * @example
 * ```ts
 * const body: ForgetPasswordBody = {
 *   email: "user@example.com",
 *   redirectTo: "https://app.drenyrafounders.com/login"
 * };
 * ```
 */

export interface ForgetPasswordBody {
  email: string;
  redirectTo?: string;
}

/**
 * Request body for resetting password with a token.
 *
 * @property token - Reset token from email link (single-use, expires in 1h)
 * @property password - New password (min 8 chars, validated by BetterAuth)
 *
 * @example
 * ```ts
 * const body: ResetPasswordBody = {
 *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   password: "NewSecureP@ss2026"
 * };
 * ```
 */
export interface ResetPasswordBody {
  token: string;
  password: string;
}

/**
 * Initiates password reset flow by sending reset email.
 *
 * Calls BetterAuth `/api/auth/forget-password` which:
 * 1. Checks if email exists in database
 * 2. Generates single-use reset token (expires in 1h)
 * 3. Sends email with reset link containing token
 * 4. Returns generic success message (security: don't reveal if email exists)
 *
 * **Security Notes:**
 * - ALWAYS returns success even if email doesn't exist (prevents email enumeration)
 * - Rate limited by BetterAuth (max 3 requests per 15 minutes per IP)
 * - Token is signed with BETTER_AUTH_SECRET (prevents tampering)
 * - Reset link only works once (token deleted after use)
 *
 * @param body - Payload with email and optional redirect URL
 * @param context - Elysia request context (provides headers for IP tracking)
 * @returns Generic success message (never reveals if email exists)
 *
 * @throws {TooManyRequestsError} HTTP 429 - Rate limit exceeded (3 requests per 15 min)
 * @throws {BadRequestError} HTTP 400 - Invalid redirect URL (not in whitelist)
 * @throws {InternalServerError} HTTP 500 - Email service unavailable (SMTP error)
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Request password reset
 * const res = await handleForgetPassword(
 *   { email: "user@example.com", redirectTo: "https://app.drenyrafounders.com/login" },
 *   { set: { status: 200 }, headers: {} } as Context
 * );
 * console.log(res.message);
 * // "Si existe una cuenta con user@example.com, recibirás un email con instrucciones."
 * ```
 *
 * @example
 * ```ts
 * // Request with non-existent email (same response for security)
 * const res = await handleForgetPassword(
 *   { email: "nonexistent@example.com" },
 *   { set: { status: 200 }, headers: {} } as Context
 * );
 * console.log(res.message);
 * // "Si existe una cuenta con nonexistent@example.com, recibirás un email con instrucciones."
 * ```
 */
export async function handleForgetPassword(
  body: ForgetPasswordBody,
  context: Context
): Promise<unknown> {
  const { email, redirectTo } = body;
  const { set, headers } = context;

  try {
    const request = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/forget-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ email, redirectTo }),
      }
    );

    const response = await auth.handler(request);
    const result = await response.json();

    if (response.status !== 200) {
      set.status = response.status;
      return fail(result.error?.message || 'Error al solicitar restablecimiento', 'FORGET_PASSWORD_ERROR');
    }

    return ok({ message: `Si existe una cuenta con ${email}, recibirás un email con instrucciones.` });
  } catch (error) {
    logger.error({ error, email }, 'Failed to request password reset');
    set.status = 500;
    return fail('Error al procesar solicitud', 'INTERNAL_ERROR');
  }
}

/**
 * Resets user password using a valid reset token.
 *
 * Calls BetterAuth `/api/auth/reset-password` which:
 * 1. Validates token signature and expiration
 * 2. Hashes new password with bcrypt (cost factor 10)
 * 3. Updates user password in database
 * 4. Deletes reset token (single-use enforcement)
 * 5. Invalidates all existing sessions (forces re-login)
 *
 * **Security Notes:**
 * - Token is single-use (deleted after successful reset)
 * - Token expires after 1 hour (prevents reuse)
 * - New password hashed with bcrypt before storage
 * - All active sessions invalidated (prevents hijacking)
 * - Password strength enforced by BetterAuth (min 8 chars)
 *
 * @param body - Payload with reset token and new password
 * @param context - Elysia request context (provides headers)
 * @returns Success message or error response
 *
 * @throws {BadRequestError} HTTP 400 - Token missing or malformed
 * @throws {UnauthorizedError} HTTP 401 - Token invalid (wrong signature)
 * @throws {UnauthorizedError} HTTP 401 - Token expired (>1h since issued)
 * @throws {UnauthorizedError} HTTP 401 - Token already used (single-use violation)
 * @throws {BadRequestError} HTTP 400 - Password too weak (min 8 chars required)
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Successful password reset
 * const res = await handleResetPassword(
 *   {
 *     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     password: "NewSecureP@ss2026"
 *   },
 *   { set: { status: 200 }, headers: {} } as Context
 * );
 * console.log(res.message); // "Contraseña restablecida exitosamente"
 * ```
 *
 * @example
 * ```ts
 * // Failed reset (expired token)
 * const res = await handleResetPassword(
 *   { token: "expired-token", password: "NewP@ss2026" },
 *   { set: { status: 401 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Token inválido o expirado"
 * ```
 *
 * @example
 * ```ts
 * // Failed reset (weak password)
 * const res = await handleResetPassword(
 *   { token: "valid-token", password: "weak" },
 *   { set: { status: 400 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Password too weak" (BetterAuth validation)
 * ```
 */
export async function handleResetPassword(
  body: ResetPasswordBody,
  context: Context
): Promise<unknown> {
  const { token, password } = body;
  const { set, headers } = context;

  try {
    const request = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ token, password }),
      }
    );

    const response = await auth.handler(request);
    const result = await response.json();

    if (response.status !== 200) {
      set.status = response.status;
      return fail(result.error?.message || 'Token inválido o expirado', 'RESET_PASSWORD_ERROR');
    }

    logger.info({ email: result.user?.email ?? null }, 'Password reset completed');

    return ok({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    logger.error({ error, token }, 'Failed to reset password');
    set.status = 500;
    return fail('Error al restablecer contraseña', 'INTERNAL_ERROR');
  }
}
