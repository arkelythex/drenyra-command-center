import { createHash, randomUUID } from "node:crypto";
import {
	accountingJobRuns,
	businessPartners,
	companies,
	db,
	eq,
	invoices,
	users,
} from "@drenyra/infrastructure";
import { afterEach, describe, expect, it } from "vitest";
import { ComplianceRoadmapService } from "../../compliance-roadmap.service";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	userId: string;
	companyId: string;
	customerId: string;
};

describeDb("ComplianceRoadmapService.runRoadmapAction (integration)", () => {
	const fixtures: Fixture[] = [];

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			await db
				.delete(accountingJobRuns)
				.where(eq(accountingJobRuns.companyId, fixture.companyId));
			await db
				.delete(invoices)
				.where(eq(invoices.companyId, fixture.companyId));
			await db
				.delete(businessPartners)
				.where(eq(businessPartners.companyId, fixture.companyId));
			await db.delete(companies).where(eq(companies.id, fixture.companyId));
			await db.delete(users).where(eq(users.id, fixture.userId));
		}
	});

	it("persists one accounting job run when prepare-sire roadmap action is executed", async () => {
		const fixture = await createFixture();
		const traceId = buildTraceId(fixture.companyId, "2026-03", "prepare-sire");

		await db.insert(invoices).values({
			id: randomUUID(),
			companyId: fixture.companyId,
			customerId: fixture.customerId,
			invoiceNumber: "F001-00000011",
			series: "F001",
			correlative: 11,
			issueDate: new Date("2026-03-08T10:00:00.000Z"),
			dueDate: new Date("2026-04-08T10:00:00.000Z"),
			currency: "PEN",
			exchangeRate: "1.0000",
			subtotal: "100.00",
			igvAmount: "18.00",
			totalAmount: "118.00",
			status: "SENT",
			sunatStatus: "DRAFT",
			balanceDue: "118.00",
			paidAmount: "0.00",
		});

		const result = await ComplianceRoadmapService.runRoadmapAction({
			companyId: fixture.companyId,
			year: 2026,
			month: 3,
			actionId: "prepare-sire",
			traceId,
		});

		expect(result.execution).toBe("QUEUED_FOR_APPROVAL");
		expect(result.runId).toBeDefined();
		expect(result.runStatus).toBe("AWAITING_APPROVAL");

		const [persistedRun] = await db
			.select()
			.from(accountingJobRuns)
			.where(eq(accountingJobRuns.id, result.runId ?? ""))
			.limit(1);

		expect(persistedRun).toBeDefined();
		expect(persistedRun).toMatchObject({
			companyId: fixture.companyId,
			countryCode: "pe",
			jobId: "prepare-sire",
			status: "AWAITING_APPROVAL",
			approvalRequired: true,
			summary: "Roadmap MVP - preparar SIRE 2026-03",
		});
		expect(persistedRun?.inputPayload).toMatchObject({
			period: "2026-03",
			source: "roadmap-mvp",
			traceId,
			actionId: "prepare-sire",
		});
	});
});

function buildTraceId(
	companyId: string,
	period: string,
	actionId: string,
): string {
	const digest = createHash("sha256")
		.update(`${companyId}:${period}:${actionId}`)
		.digest("hex")
		.slice(0, 16);
	return `rmp_${digest}`;
}

async function createFixture(): Promise<Fixture> {
	const userId = randomUUID();
	const companyId = randomUUID();
	const customerId = randomUUID();
	const unique = randomUUID().replace(/-/g, "").slice(0, 9);

	await db.insert(users).values({
		id: userId,
		email: `integration-roadmap-${userId}@arkalythix.local`,
		password: "integration-password",
		name: "Integration Owner",
		role: "ADMIN",
		isActive: true,
	});

	await db.insert(companies).values({
		id: companyId,
		ownerId: userId,
		ruc: `20${unique}`,
		businessName: `Integration Roadmap ${companyId.slice(0, 8)}`,
		tradeName: "Integration",
		isActive: true,
	});

	await db.insert(businessPartners).values({
		id: customerId,
		companyId,
		taxId: "20123456789",
		legalName: "Integration Customer SAC",
	});

	return { userId, companyId, customerId };
}
