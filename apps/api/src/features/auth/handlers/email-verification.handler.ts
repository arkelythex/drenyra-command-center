import { Context } from 'elysia';
import { createLogger } from '../../../lib/logger';
import { auth } from '../auth.config';
import { ok, fail } from '../../shared/api-response';

const logger = createLogger({ feature: 'auth', handler: 'email-verification' });

/**
 * Email Verification Handlers
 *
 * Handles email verification flow required before login.
 * DRENYRA requires email verification to prevent:
 * - Spam signups with fake emails
 * - Account hijacking via typosquatting
 * - Bot registrations
 *
 * **Security Model:**
 * - Verification tokens are single-use and time-limited (24h expiration)
 * - Tokens cryptographically signed (prevents tampering)
 * - Login blocked until emailVerified=true
 * - Resend verification rate-limited (max 3 per 15 min)
 *
 * **Flow:**
 * 1. User signs up → verification email sent automatically
 * 2. User clicks link with token in query string
 * 3. System validates token and marks email as verified
 * 4. User can now login
 *
 * @module auth/handlers/email-verification
 * Request body for sending a verification email.
 *
 * @property email - User email to send verification link to
 * @property callbackURL - URL to redirect after verification (must be whitelisted)
 *
 * @example
 * ```ts
 * const body: SendVerificationEmailBody = {
 *   email: "user@example.com",
 *   callbackURL: "https://app.drenyrafounders.com/login"
 * };
 * ```
 */

export interface SendVerificationEmailBody {
  email: string;
  callbackURL: string;
}

/**
 * Query params for verifying an email.
 *
 * @property token - Verification token from email link (single-use, expires in 24h)
 *
 * @example
 * ```ts
 * const query: VerifyEmailQuery = {
 *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * };
 * ```
 */
export interface VerifyEmailQuery {
  token: string;
}

/**
 * Sends verification email to user.
 *
 * Calls BetterAuth `/api/auth/send-verification-email` which:
 * 1. Checks if email exists and is unverified
 * 2. Generates single-use verification token (expires in 24h)
 * 3. Sends email with verification link
 * 4. Returns success message
 *
 * **Security Notes:**
 * - Rate limited (max 3 requests per 15 min per email)
 * - Only sends to registered, unverified emails
 * - Callback URL must be in trustedOrigins whitelist
 * - Token is signed with BETTER_AUTH_SECRET
 *
 * **Use Cases:**
 * - Resend verification if user didn't receive initial email
 * - Resend if verification link expired (24h)
 *
 * @param body - Payload with email and callback URL
 * @param context - Elysia request context (provides headers)
 * @returns Success message or error response
 *
 * @throws {NotFoundError} HTTP 404 - Email not found (user doesn't exist)
 * @throws {BadRequestError} HTTP 400 - Email already verified (no action needed)
 * @throws {BadRequestError} HTTP 400 - Invalid callback URL (not in whitelist)
 * @throws {TooManyRequestsError} HTTP 429 - Rate limit exceeded (3 per 15 min)
 * @throws {InternalServerError} HTTP 500 - Email service unavailable (SMTP error)
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Send verification email
 * const res = await handleSendVerificationEmail(
 *   {
 *     email: "user@example.com",
 *     callbackURL: "https://app.drenyrafounders.com/login"
 *   },
 *   { set: { status: 200 }, headers: {} } as Context
 * );
 * console.log(res.message); // "Email de verificación enviado a user@example.com"
 * ```
 *
 * @example
 * ```ts
 * // Failed send (email already verified)
 * const res = await handleSendVerificationEmail(
 *   { email: "verified@example.com", callbackURL: "https://app.drenyrafounders.com" },
 *   { set: { status: 400 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Email already verified"
 * ```
 */
export async function handleSendVerificationEmail(
  body: SendVerificationEmailBody,
  context: Context
): Promise<unknown> {
  const { email, callbackURL } = body;
  const { set, headers } = context;

  try {
    const request = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/send-verification-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ email, callbackURL }),
      }
    );

    const response = await auth.handler(request);
    const result = await response.json();

    if (response.status !== 200) {
      set.status = response.status;
      return fail(result.error?.message || 'Error al enviar email', 'EMAIL_SEND_ERROR');
    }

    return ok({ message: `Email de verificación enviado a ${email}` });
  } catch (error) {
    logger.error({ error, email }, 'Failed to send verification email');
    set.status = 500;
    return fail('Error al enviar email de verificación', 'EMAIL_SEND_ERROR');
  }
}

/**
 * Verifies user email using token from verification link.
 *
 * Calls BetterAuth `/api/auth/verify-email` which:
 * 1. Validates token signature and expiration
 * 2. Finds user associated with token
 * 3. Marks user.emailVerified = true
 * 4. Deletes verification token (single-use)
 * 5. Returns user data
 *
 * **Security Notes:**
 * - Token is single-use (deleted after successful verification)
 * - Token expires after 24 hours (prevents reuse)
 * - Token signed with BETTER_AUTH_SECRET (prevents tampering)
 * - User can now login after verification
 *
 * **User Experience:**
 * - Typically called via GET link in email (token in query string)
 * - Frontend redirects to login page after success
 * - If token expired, user can request resend
 *
 * @param query - Query params with verification token
 * @param context - Elysia request context (provides headers)
 * @returns Success message with user data, or error response
 *
 * @throws {BadRequestError} HTTP 400 - Token missing from query string
 * @throws {UnauthorizedError} HTTP 401 - Token invalid (wrong signature)
 * @throws {UnauthorizedError} HTTP 401 - Token expired (>24h since issued)
 * @throws {UnauthorizedError} HTTP 401 - Token already used (single-use violation)
 * @throws {NotFoundError} HTTP 404 - User associated with token not found (deleted account)
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 *
 * @example
 * ```ts
 * // Successful email verification
 * const res = await handleVerifyEmail(
 *   { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
 *   { set: { status: 200 }, headers: {} } as Context
 * );
 * console.log(res.message); // "Email verificado exitosamente"
 * console.log(res.user.emailVerified); // true
 * ```
 *
 * @example
 * ```ts
 * // Failed verification (expired token)
 * const res = await handleVerifyEmail(
 *   { token: "expired-token" },
 *   { set: { status: 401 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Token inválido o expirado"
 * ```
 *
 * @example
 * ```ts
 * // Failed verification (missing token)
 * const res = await handleVerifyEmail(
 *   { token: "" },
 *   { set: { status: 400 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Token requerido"
 * ```
 */
export async function handleVerifyEmail(
  query: VerifyEmailQuery,
  context: Context
): Promise<unknown> {
  const { token } = query;
  const { set, headers } = context;

  try {
    if (!token) {
      set.status = 400;
      return fail('Token requerido', 'TOKEN_REQUIRED');
    }

    const request = new Request(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );

    const response = await auth.handler(request);
    const result = await response.json();

    if (response.status !== 200) {
      set.status = response.status;
      return fail(result.error?.message || 'Token inválido o expirado', 'TOKEN_INVALID');
    }

    logger.info({ email: result.user?.email ?? null }, 'Email verified');

    return ok({
      message: 'Email verificado exitosamente',
      user: result.user,
    });
  } catch (error) {
    logger.error({ error, token }, 'Failed to verify email');
    set.status = 500;
    return fail('Error al verificar email', 'EMAIL_VERIFY_ERROR');
  }
}
