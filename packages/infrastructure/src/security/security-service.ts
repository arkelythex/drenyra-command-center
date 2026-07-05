// Security Service - Failed Login Protection
// Handles rate limiting and account locking

import { db } from "@drenyra/persistence/client";
import { accessLogs, failedLoginAttempts } from "@drenyra/persistence/schema";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const WINDOW_MINUTES = 15;

/**
 * Result returned after recording one failed login attempt.
 *
 * @example
 * ```ts
 * const result: LoginAttemptResult = { allowed: false, attemptCount: 5 };
 * ```
 */
export interface LoginAttemptResult {
	allowed: boolean;
	reason?: string;
	lockedUntil?: Date;
	attemptCount: number;
}

/**
 * Records a failed login and applies lockout thresholds.
 *
 * @param email - User email used for auth attempt
 * @param ipAddress - Source IP for audit and abuse tracking
 * @param userAgent - Optional browser/client user-agent
 * @param reason - Failure reason classification
 * @returns Current lockout decision and rolling attempt count
 * @example
 * ```ts
 * const result = await recordFailedLogin("ops@drenyrafounders.com", "203.0.113.10");
 * ```
 */
export async function recordFailedLogin(
	email: string,
	ipAddress: string,
	userAgent?: string,
	reason:
		| "INVALID_CREDENTIALS"
		| "ACCOUNT_LOCKED"
		| "MFA_REQUIRED" = "INVALID_CREDENTIALS",
): Promise<LoginAttemptResult> {
	const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

	const existing = await db
		.select()
		.from(failedLoginAttempts)
		.where(
			and(
				eq(failedLoginAttempts.email, email),
				gt(failedLoginAttempts.createdAt, windowStart),
			),
		)
		.orderBy(desc(failedLoginAttempts.createdAt))
		.limit(1);

	const currentCount = existing.length > 0 ? existing[0].attemptCount + 1 : 1;
	const isLocked = currentCount >= MAX_ATTEMPTS;

	const lockedUntil = isLocked
		? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
		: undefined;

	await db.insert(failedLoginAttempts).values({
		email,
		ipAddress,
		userAgent,
		reason,
		attemptCount: currentCount,
		lockedUntil: lockedUntil || null,
	});

	return {
		allowed: !isLocked,
		reason: isLocked ? "ACCOUNT_LOCKED" : undefined,
		lockedUntil,
		attemptCount: currentCount,
	};
}

/**
 * Clears recent failed attempts and writes a successful login access log.
 *
 * @param userId - Authenticated user id
 * @param email - Authenticated email
 * @param ipAddress - Source IP used during login
 * @param userAgent - Optional browser/client user-agent
 * @returns Promise that resolves when cleanup and audit insert complete
 * @example
 * ```ts
 * await recordSuccessfulLogin("usr_1", "ops@drenyrafounders.com", "203.0.113.10");
 * ```
 */
export async function recordSuccessfulLogin(
	userId: string,
	email: string,
	ipAddress: string,
	userAgent?: string,
): Promise<void> {
	const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

	await db
		.delete(failedLoginAttempts)
		.where(
			and(
				eq(failedLoginAttempts.email, email),
				gt(failedLoginAttempts.createdAt, windowStart),
			),
		);

	await db.insert(accessLogs).values({
		userId,
		userEmail: email,
		action: "LOGIN",
		resource: "auth",
		result: "ALLOW",
		ipAddress,
		userAgent,
	});
}

/**
 * Evaluates whether an account is currently locked due to failed attempts.
 *
 * @param email - User email to evaluate
 * @returns Lock state, unlock timestamp (if any), and attempt count
 * @example
 * ```ts
 * const state = await isAccountLocked("ops@drenyrafounders.com");
 * ```
 */
export async function isAccountLocked(email: string): Promise<{
	locked: boolean;
	lockedUntil?: Date;
	attempts: number;
}> {
	const locked = await db
		.select()
		.from(failedLoginAttempts)
		.where(
			and(
				eq(failedLoginAttempts.email, email),
				eq(failedLoginAttempts.reason, "ACCOUNT_LOCKED"),
				isNotNull(failedLoginAttempts.lockedUntil),
				gt(failedLoginAttempts.lockedUntil, new Date()),
			),
		)
		.orderBy(desc(failedLoginAttempts.createdAt))
		.limit(1);

	const lockedAttempt = locked[0];
	if (lockedAttempt?.lockedUntil) {
		return {
			locked: true,
			lockedUntil: lockedAttempt.lockedUntil,
			attempts: lockedAttempt.attemptCount,
		};
	}

	// Scope evidence: failed-login lockout is intentionally keyed by email before
	// tenantId/companyId/RUC resolution, so no fiscal tenant scope exists yet.
	const recentAttempts = await db
		.select({ count: sql<number>`count(*)` })
		.from(failedLoginAttempts)
		.where(eq(failedLoginAttempts.email, email));

	return {
		locked: false,
		attempts: recentAttempts[0]?.count || 0,
	};
}
