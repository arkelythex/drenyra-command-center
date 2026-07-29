/**
 * MFA Database Adapter — Drizzle implementation of MfaDbAdapter.
 *
 * Provides persistence for MFA operations using the Drenyra Drizzle schema.
 */

import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { authUsers } from "@drenyra/persistence/schema";
import type { MfaDbAdapter, MfaUser } from "@drenyra/security/mfa";
import { createLogger } from "../../../lib/logger";

const logger = createLogger({ feature: "auth", handler: "mfa-db-adapter" });

export function createMfaDbAdapter(): MfaDbAdapter {
	return {
		async findUserById(id: string): Promise<MfaUser | null> {
			const rows = await db
				.select({
					id: authUsers.id,
					email: authUsers.email,
					totpSecret: authUsers.totpSecret,
					totpEnabled: authUsers.totpEnabled,
					recoveryCodes: authUsers.recoveryCodes,
					mfaFailureCount: authUsers.mfaFailureCount,
				})
				.from(authUsers)
				.where(eq(authUsers.id, id))
				.limit(1);

			const row = rows[0];
			if (!row) return null;
			return {
				id: row.id,
				email: row.email,
				totpSecret: row.totpSecret,
				totpEnabled: row.totpEnabled,
				recoveryCodes: (row.recoveryCodes as (string | null)[]) ?? [],
				mfaFailureCount: row.mfaFailureCount,
			};
		},

		async findUserByEmail(email: string): Promise<MfaUser | null> {
			const rows = await db
				.select({
					id: authUsers.id,
					email: authUsers.email,
					totpSecret: authUsers.totpSecret,
					totpEnabled: authUsers.totpEnabled,
					recoveryCodes: authUsers.recoveryCodes,
					mfaFailureCount: authUsers.mfaFailureCount,
				})
				.from(authUsers)
				.where(eq(authUsers.email, email))
				.limit(1);

			const row = rows[0];
			if (!row) return null;
			return {
				id: row.id,
				email: row.email,
				totpSecret: row.totpSecret,
				totpEnabled: row.totpEnabled,
				recoveryCodes: (row.recoveryCodes as (string | null)[]) ?? [],
				mfaFailureCount: row.mfaFailureCount,
			};
		},

		async updateTotpSecret(userId: string, secret: string): Promise<void> {
			await db
				.update(authUsers)
				.set({ totpSecret: secret, updatedAt: new Date() })
				.where(eq(authUsers.id, userId));
			logger.info({ userId }, "TOTP secret stored (not yet enabled)");
		},

		async enableTotp(
			userId: string,
			recoveryCodeHashes: (string | null)[],
		): Promise<void> {
			await db
				.update(authUsers)
				.set({
					totpEnabled: true,
					totpVerifiedAt: new Date(),
					recoveryCodes: recoveryCodeHashes as unknown as string[],
					mfaFailureCount: 0,
					updatedAt: new Date(),
				})
				.where(eq(authUsers.id, userId));
			logger.info({ userId }, "TOTP enabled with recovery codes");
		},

		async disableTotp(userId: string): Promise<void> {
			await db
				.update(authUsers)
				.set({
					totpSecret: null,
					totpEnabled: false,
					totpVerifiedAt: null,
					recoveryCodes: [],
					mfaFailureCount: 0,
					mfaLastFailureAt: null,
					updatedAt: new Date(),
				})
				.where(eq(authUsers.id, userId));
			logger.info({ userId }, "TOTP disabled");
		},

		async incrementMfaFailure(userId: string): Promise<number> {
			const rows = await db
				.select({ mfaFailureCount: authUsers.mfaFailureCount })
				.from(authUsers)
				.where(eq(authUsers.id, userId))
				.limit(1);

			const current = rows[0]?.mfaFailureCount ?? 0;
			const newCount = current + 1;

			await db
				.update(authUsers)
				.set({
					mfaFailureCount: newCount,
					mfaLastFailureAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(authUsers.id, userId));

			logger.warn({ userId, count: newCount }, "MFA failure recorded");
			return newCount;
		},

		async resetMfaFailure(userId: string): Promise<void> {
			await db
				.update(authUsers)
				.set({
					mfaFailureCount: 0,
					mfaLastFailureAt: null,
					updatedAt: new Date(),
				})
				.where(eq(authUsers.id, userId));
		},

		async consumeRecoveryCode(userId: string, index: number): Promise<void> {
			const rows = await db
				.select({ recoveryCodes: authUsers.recoveryCodes })
				.from(authUsers)
				.where(eq(authUsers.id, userId))
				.limit(1);

			const codes = (rows[0]?.recoveryCodes as (string | null)[]) ?? [];
			if (index >= 0 && index < codes.length) {
				codes[index] = null;
			}

			await db
				.update(authUsers)
				.set({
					recoveryCodes: codes as unknown as string[],
					updatedAt: new Date(),
				})
				.where(eq(authUsers.id, userId));

			logger.info({ userId, codeIndex: index }, "Recovery code consumed");
		},
	};
}
