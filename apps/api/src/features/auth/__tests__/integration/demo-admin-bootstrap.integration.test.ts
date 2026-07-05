import {
	authSessions,
	authUserCompanies,
	authUsers,
	db,
	eq,
	seedDatabase,
} from "@drenyra/infrastructure";
import { desc } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";

await loadApiEnv();

const bootstrapModule = await import("../../dev/bootstrap-demo-admin");

const { DEMO_ADMIN_EMAIL, DEMO_ADMIN_RUC, bootstrapDemoAdminAuthUser } =
	bootstrapModule;

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("demo admin bootstrap (integration)", () => {
	beforeAll(async () => {
		await seedDatabase();
	});

	it("bootstraps deterministic Better Auth identity for the demo admin", async () => {
		const bootstrap = await bootstrapDemoAdminAuthUser();

		const seededUserRows = await db
			.select({
				id: authUsers.id,
				email: authUsers.email,
				emailVerified: authUsers.emailVerified,
				ruc: authUsers.ruc,
			})
			.from(authUsers)
			.where(eq(authUsers.id, bootstrap.userId))
			.limit(1);

		expect(seededUserRows).toEqual([
			{
				id: bootstrap.userId,
				email: DEMO_ADMIN_EMAIL,
				emailVerified: true,
				ruc: DEMO_ADMIN_RUC,
			},
		]);

		const membershipRows = await db
			.select({
				companyId: authUserCompanies.companyId,
				membershipRole: authUserCompanies.membershipRole,
				isDefault: authUserCompanies.isDefault,
			})
			.from(authUserCompanies)
			.where(eq(authUserCompanies.userId, bootstrap.userId));

		expect(membershipRows).toEqual([
			{
				companyId: bootstrap.companyId,
				membershipRole: "OWNER",
				isDefault: true,
			},
		]);

		await expect(
			readLatestSessionCookie(bootstrap.userId),
		).resolves.toBeTruthy();
	});
});

async function readLatestSessionCookie(
	userId: string,
): Promise<string | undefined> {
	const sessions = await db
		.select({ token: authSessions.token })
		.from(authSessions)
		.where(eq(authSessions.userId, userId))
		.orderBy(desc(authSessions.createdAt))
		.limit(1);

	const token = sessions[0]?.token;
	return token ? `better-auth.session_token=${token}` : undefined;
}
