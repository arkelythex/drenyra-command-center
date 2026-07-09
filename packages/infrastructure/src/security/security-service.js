import { db } from "@drenyra/persistence/client";
import { accessLogs, failedLoginAttempts } from "@drenyra/persistence/schema";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const WINDOW_MINUTES = 15;
export async function recordFailedLogin(
	email,
	ipAddress,
	userAgent,
	reason = "INVALID_CREDENTIALS",
) {
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
export async function recordSuccessfulLogin(
	userId,
	email,
	ipAddress,
	userAgent,
) {
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
export async function isAccountLocked(email) {
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
	const recentAttempts = await db
		.select({ count: sql`count(*)` })
		.from(failedLoginAttempts)
		.where(eq(failedLoginAttempts.email, email));
	return {
		locked: false,
		attempts: recentAttempts[0]?.count || 0,
	};
}

