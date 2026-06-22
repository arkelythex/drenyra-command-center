import { randomUUID } from "node:crypto";
import {
	companies,
	db,
	eq,
	transactions,
	users,
} from "@arkelythex/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { electronicInvoicingModule } from "../../index";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	userId: string;
	companyId: string;
	transactionId: string;
};

describeDb("electronic invoicing governance (integration)", () => {
	const app = new Elysia().use(electronicInvoicingModule);
	const fixtures: Fixture[] = [];
	const originalEnv = { ...process.env };

	afterEach(async () => {
		process.env = { ...originalEnv };

		for (const fixture of fixtures.splice(0)) {
			await db
				.delete(transactions)
				.where(eq(transactions.id, fixture.transactionId));
			await db.delete(companies).where(eq(companies.id, fixture.companyId));
			await db.delete(users).where(eq(users.id, fixture.userId));
		}
	});

	it("blocks send route with kill switch and writes BLOCK governance event", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "true";

		const fixture = await createFixture();

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/send", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": fixture.companyId,
				},
				body: JSON.stringify({
					transactionId: fixture.transactionId,
					xmlContent: "<Invoice></Invoice>",
					invoiceNumber: "F001-0001",
					invoiceType: "01",
				}),
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "AUTONOMY_KILL_SWITCH_ACTIVE",
			governance: { decision: "BLOCK" },
		});

		const persisted = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixture.transactionId),
			columns: { tags: true },
		});
		expect(persisted).toBeTruthy();

		const trail = getTrail(persisted?.tags);
		expect(
			trail.some(
				(event) =>
					event.stage === "AUTONOMY_POLICY" && event.status === "BLOCK",
			),
		).toBe(true);
	});

	it("allows critical send with approval override and writes ALLOW governance event", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "false";
		process.env.AUTONOMY_REQUIRE_APPROVAL_FOR_CRITICAL = "true";

		const fixture = await createFixture();

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/send", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": fixture.companyId,
				},
				body: JSON.stringify({
					transactionId: fixture.transactionId,
					xmlContent: "<Invoice></Invoice>",
					invoiceNumber: "F001-0002",
					invoiceType: "01",
					priority: "critical",
					governance: {
						approval: {
							approvedBy: "controller@arkalythix.local",
							reason: "critical window override",
						},
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				success: false,
				governance: { decision: "ALLOW" },
			},
		});

		const persisted = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixture.transactionId),
			columns: { tags: true },
		});
		expect(persisted).toBeTruthy();

		const trail = getTrail(persisted?.tags);
		expect(
			trail.some(
				(event) =>
					event.stage === "AUTONOMY_POLICY" && event.status === "ALLOW",
			),
		).toBe(true);
	});
});

async function createFixture(): Promise<Fixture> {
	const userId = randomUUID();
	const companyId = randomUUID();
	const transactionId = randomUUID();
	const unique = randomUUID().replace(/-/g, "").slice(0, 9);

	await db.insert(users).values({
		id: userId,
		email: `integration-ei-${userId}@arkalythix.local`,
		password: "integration-password",
		name: "Integration Owner",
		role: "ADMIN",
		isActive: true,
	});

	await db.insert(companies).values({
		id: companyId,
		ownerId: userId,
		ruc: `20${unique}`,
		businessName: `Electronic Integration ${companyId.slice(0, 8)}`,
		tradeName: "E-Invoice Integration",
		isActive: true,
	});

	await db.insert(transactions).values({
		id: transactionId,
		companyId,
		type: "INCOME",
		documentType: "FACTURA",
		series: "F001",
		number: "1",
		issueDate: new Date("2026-02-10T10:00:00.000Z"),
		currency: "PEN",
		exchangeRate: "1.000",
		subtotal: "100.00",
		igvAmount: "18.00",
		totalAmount: "118.00",
		status: "DRAFT",
	});

	return {
		userId,
		companyId,
		transactionId,
	};
}

function getTrail(tags: unknown): Array<{ stage: string; status: string }> {
	if (!tags || typeof tags !== "object" || Array.isArray(tags)) return [];
	const record = tags as Record<string, unknown>;
	const trail = record.electronicInvoicingTrail;
	if (!Array.isArray(trail)) return [];

	return trail
		.filter((item) => item && typeof item === "object" && !Array.isArray(item))
		.map((item) => {
			const event = item as Record<string, unknown>;
			return {
				stage: typeof event.stage === "string" ? event.stage : "",
				status: typeof event.status === "string" ? event.status : "",
			};
		});
}
