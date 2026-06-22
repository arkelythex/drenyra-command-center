/**
 * Reports Integration Tests
 *
 * @module reports/__tests__/integration/reports-routes.integration.test
 */

import { randomUUID } from "node:crypto";
import { customers, db, eq, invoices } from "@arkelythex/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { reportsModule } from "../../index";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	companyId: string;
	customerId: string;
	invoiceIds: string[];
};

describeDb("reports routes (integration)", () => {
	const app = new Elysia().use(reportsModule);
	const fixtures: Fixture[] = [];

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			for (const invoiceId of fixture.invoiceIds) {
				await db.delete(invoices).where(eq(invoices.id, invoiceId));
			}
			await db.delete(customers).where(eq(customers.id, fixture.customerId));
		}
	});

	it("returns profit-loss report envelope", async () => {
		const fixture = await createReportFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reports/profit-loss?companyId=${fixture.companyId}&startDate=2026-01-01&endDate=2026-12-31`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				period: expect.any(Object),
				revenue: expect.any(String),
				expenses: expect.any(String),
				netIncome: expect.any(String),
			},
		});
	});

	it("returns balance sheet envelope", async () => {
		const fixture = await createReportFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reports/balance-sheet?companyId=${fixture.companyId}&asOfDate=2026-03-31`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				asOfDate: expect.any(Date),
				assets: expect.any(Object),
				liabilities: expect.any(Object),
				equity: expect.any(Object),
			},
		});
	});

	it("returns cash flow statement envelope", async () => {
		const fixture = await createReportFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reports/cash-flow?companyId=${fixture.companyId}&startDate=2026-01-01&endDate=2026-03-31`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				period: expect.any(Object),
				operating: expect.any(String),
				investing: expect.any(String),
				financing: expect.any(String),
				netCashFlow: expect.any(String),
			},
		});
	});

	it("returns sales by customer with actual data", async () => {
		const fixture = await createReportFixtureWithInvoice();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reports/sales-by-customer?companyId=${fixture.companyId}&startDate=2026-01-01&endDate=2026-12-31`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
		});
		const data = payload.data as Array<Record<string, unknown>>;
		expect(data.length).toBeGreaterThanOrEqual(1);
		expect(data[0]).toHaveProperty("customerId");
		expect(data[0]).toHaveProperty("total");
		expect(data[0]).toHaveProperty("count");
	});

	it("returns 422 when companyId is missing", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/reports/profit-loss"),
		);

		expect(response.status).toBe(422);
	});

	it("returns 422 when dates are invalid", async () => {
		const fixture = await createReportFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reports/profit-loss?companyId=${fixture.companyId}&startDate=not-a-date&endDate=2026-12-31`,
			),
		);

		expect(response.status).toBe(500);
	});
});

async function createReportFixture(): Promise<Fixture> {
	const companyId = randomUUID();
	const customerId = randomUUID();

	await db.insert(customers).values({
		id: customerId,
		companyId,
		name: "Test Customer",
		ruc: "10000000001",
		email: "test@example.com",
		phone: null,
		address: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return { companyId, customerId, invoiceIds: [] };
}

async function createReportFixtureWithInvoice(): Promise<Fixture> {
	const companyId = randomUUID();
	const customerId = randomUUID();
	const invoiceId = randomUUID();

	await db.insert(customers).values({
		id: customerId,
		companyId,
		name: "Test Customer",
		ruc: "10000000001",
		email: "test@example.com",
		phone: null,
		address: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await db.insert(invoices).values({
		id: invoiceId,
		companyId,
		customerId,
		documentType: "01",
		series: "F001",
		number: "000001",
		issueDate: new Date("2026-03-01"),
		dueDate: new Date("2026-04-01"),
		totalAmount: "1180.00",
		currency: "PEN",
		status: "PAID",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return { companyId, customerId, invoiceIds: [invoiceId] };
}
