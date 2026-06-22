import { authAccounts, authAuditLogs, authSessions, authUserCompanies, authUsers, authVerifications } from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { and, eq } from "@arkelythex/persistence/query";
import { auth } from "../auth.config";
import { ensureUserCompanyMembershipFromRuc } from "../handlers/company-membership";

export const DEMO_ADMIN_EMAIL = "admin@arkelythexfounders.com";
export const DEMO_ADMIN_PASSWORD = "password123";
export const DEMO_ADMIN_NAME = "Admin User";
export const DEMO_ADMIN_RUC = "20608451231";

export interface BootstrapDemoAdminResult {
	userId: string;
	companyId: string;
	companyName: string;
	email: string;
	password: string;
	ruc: string;
}

/**
 * Rebuild the local Better Auth demo admin so dev login is deterministic.
 *
 * The infrastructure seed still owns the demo company and business data.
 * This bootstrap owns only Better Auth identity, password, verification state,
 * and company membership wiring for the demo admin account.
 */
export async function bootstrapDemoAdminAuthUser(): Promise<BootstrapDemoAdminResult> {
	const existingUsers = await db
		.select({ id: authUsers.id })
		.from(authUsers)
		.where(eq(authUsers.email, DEMO_ADMIN_EMAIL));

	if (existingUsers.length > 0) {
		await db.transaction(async (tx) => {
			for (const existingUser of existingUsers) {
				await tx.delete(authUserCompanies).where(eq(authUserCompanies.userId, existingUser.id));
				await tx.delete(authSessions).where(eq(authSessions.userId, existingUser.id));
				await tx.delete(authAccounts).where(eq(authAccounts.userId, existingUser.id));
				await tx.delete(authAuditLogs).where(eq(authAuditLogs.userId, existingUser.id));
				await tx.delete(authUsers).where(eq(authUsers.id, existingUser.id));
			}
			await tx.delete(authVerifications).where(eq(authVerifications.identifier, DEMO_ADMIN_EMAIL));
		});
	}

	await auth.api.signUpEmail({
		body: {
			email: DEMO_ADMIN_EMAIL,
			password: DEMO_ADMIN_PASSWORD,
			name: DEMO_ADMIN_NAME,
			ruc: DEMO_ADMIN_RUC,
		},
	});

	const createdUsers = await db
		.select({ id: authUsers.id })
		.from(authUsers)
		.where(eq(authUsers.email, DEMO_ADMIN_EMAIL))
		.limit(1);

	const createdUser = createdUsers[0];
	if (!createdUser) {
		throw new Error("Better Auth did not create the demo admin user.");
	}

	await db
		.update(authUsers)
		.set({
			emailVerified: true,
			ruc: DEMO_ADMIN_RUC,
		})
		.where(eq(authUsers.id, createdUser.id));

	await db
		.update(authAccounts)
		.set({ isPrimary: true })
		.where(
			and(
				eq(authAccounts.userId, createdUser.id),
				eq(authAccounts.providerId, "credential"),
			),
		);

	const membership = await ensureUserCompanyMembershipFromRuc(createdUser.id, DEMO_ADMIN_RUC);
	if (!membership) {
		throw new Error(
			`No company found for demo RUC ${DEMO_ADMIN_RUC}. Run the infrastructure seed first.`,
		);
	}

	return {
		userId: createdUser.id,
		companyId: membership.companyId,
		companyName: membership.companyName,
		email: DEMO_ADMIN_EMAIL,
		password: DEMO_ADMIN_PASSWORD,
		ruc: DEMO_ADMIN_RUC,
	};
}
