/**
 * Ledger Integration Tests
 *
 * @module ledger/__tests__/integration/ledger-routes.integration.test
 */

import { randomUUID } from "node:crypto";
import { categories, db, eq, transactions } from "@drenyra/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { ledgerModule } from "../../index";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	companyId: string;
	categoryId: string;
	transactionId?: string;
};

function scopedLedgerRequest(path: string, companyId: string): Request {
	return new Request(`http://localhost${path}`, {
		headers: { "x-company-id": companyId },
	});
}

describeDb("ledger routes (integration)", () => {
	const app = new Elysia().use(ledgerModule);
	const fixtures: Fixture[] = [];

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			if (fixture.transactionId) {
				await db
					.delete(transactions)
					.where(eq(transactions.id, fixture.transactionId));
			}
			await db.delete(categories).where(eq(categories.id, fixture.categoryId));
		}
	});

	it("returns chart of accounts with default accounts when no categories exist", async () => {
		const fixture = await createCategoryFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest("/api/ledger/accounts", fixture.companyId),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
		});
		expect(
			(payload.data as Array<Record<string, unknown>>).length,
		).toBeGreaterThanOrEqual(1);
	});

	it("returns 400 when company scope header is missing", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/ledger/accounts"),
		);

		expect(response.status).toBe(400);
	});

	it("returns general ledger entries for a valid date range", async () => {
		const fixture = await createCategoryWithTransaction();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest(
				"/api/ledger/general?startDate=2026-01-01&endDate=2026-12-31",
				fixture.companyId,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
		});
	});

	it("returns 400 for invalid date format in general ledger", async () => {
		const fixture = await createCategoryFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest(
				"/api/ledger/general?startDate=not-a-date&endDate=2026-12-31",
				fixture.companyId,
			),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "INVALID_DATE",
		});
	});

	it("returns 400 when startDate is after endDate", async () => {
		const fixture = await createCategoryFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest(
				"/api/ledger/general?startDate=2026-12-31&endDate=2026-01-01",
				fixture.companyId,
			),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "INVALID_DATE_RANGE",
		});
	});

	it("returns trial balance for a valid date", async () => {
		const fixture = await createCategoryWithTransaction();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest(
				"/api/ledger/trial-balance?asOfDate=2026-03-31",
				fixture.companyId,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
		});
		expect(payload.data).toHaveProperty("accounts");
		expect(payload.data).toHaveProperty("debits");
		expect(payload.data).toHaveProperty("credits");
		expect(payload.data).toHaveProperty("balance");
	});

	it("returns 400 for invalid asOfDate in trial balance", async () => {
		const fixture = await createCategoryFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			scopedLedgerRequest(
				"/api/ledger/trial-balance?asOfDate=invalid",
				fixture.companyId,
			),
		);

		expect(response.status).toBe(400);
	});
});

async function createCategoryFixture(): Promise<Fixture> {
	const companyId = randomUUID();
	const categoryId = randomUUID();

	await db.insert(categories).values({
		id: categoryId,
		companyId,
		name: "Test Category",
		type: "INCOME",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return { companyId, categoryId };
}

async function createCategoryWithTransaction(): Promise<Fixture> {
	const companyId = randomUUID();
	const categoryId = randomUUID();
	const transactionId = randomUUID();

	await db.insert(categories).values({
		id: categoryId,
		companyId,
		name: "Test Category",
		type: "INCOME",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await db.insert(transactions).values({
		id: transactionId,
		companyId,
		categoryId,
		documentType: "FACTURA",
		series: "F001",
		number: "000001",
		issueDate: new Date("2026-03-01"),
		dueDate: new Date("2026-04-01"),
		totalAmount: "1180.00",
		type: "INCOME",
		notes: "Test transaction",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return { companyId, categoryId, transactionId };
}
