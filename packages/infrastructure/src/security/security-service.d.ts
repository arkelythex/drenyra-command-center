export interface LoginAttemptResult {
	allowed: boolean;
	reason?: string;
	lockedUntil?: Date;
	attemptCount: number;
}
export declare function recordFailedLogin(
	email: string,
	ipAddress: string,
	userAgent?: string,
	reason?: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "MFA_REQUIRED",
): Promise<LoginAttemptResult>;
export declare function recordSuccessfulLogin(
	userId: string,
	email: string,
	ipAddress: string,
	userAgent?: string,
): Promise<void>;
export declare function isAccountLocked(email: string): Promise<{
	locked: boolean;
	lockedUntil?: Date;
	attempts: number;
}>;
//# sourceMappingURL=security-service.d.ts.map
