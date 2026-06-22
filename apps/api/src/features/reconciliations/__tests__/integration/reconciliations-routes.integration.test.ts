import { randomUUID } from "node:crypto";
import {
	bankAccounts,
	bankTransactions,
	db,
	eq,
} from "@arkelythex/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { reconciliationsModule } from "../../index";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	companyId: string;
	accountId: string;
	transactionId: string;
};

describeDb("reconciliations routes (integration)", () => {
	const app = new Elysia().use(reconciliationsModule);
	const fixtures: Fixture[] = [];

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			await db
				.delete(bankTransactions)
				.where(eq(bankTransactions.id, fixture.transactionId));
			await db
				.delete(bankAccounts)
				.where(eq(bankAccounts.id, fixture.accountId));
		}
	});

	it("returns pending transactions scoped by companyId", async () => {
		const fixtureA = await createFixture();
		const fixtureB = await createFixture();
		fixtures.push(fixtureA, fixtureB);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reconciliations/pending?companyId=${fixtureA.companyId}&limit=50`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({ success: true });

		const txIds = (payload.data as Array<{ id: string }>).map((tx) => tx.id);
		expect(txIds).toContain(fixtureA.transactionId);
		expect(txIds).not.toContain(fixtureB.transactionId);
	});

	it("returns 404 when reconciling a transaction outside tenant scope", async () => {
		const ownerFixture = await createFixture();
		const foreignFixture = await createFixture();
		fixtures.push(ownerFixture, foreignFixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/reconciliations/${ownerFixture.transactionId}/reconcile`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						companyId: foreignFixture.companyId,
						notes: "tenant mismatch attempt",
					}),
				},
			),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "TRANSACTION_NOT_FOUND",
		});

		const persisted = await db.query.bankTransactions.findFirst({
			where: eq(bankTransactions.id, ownerFixture.transactionId),
			columns: { reconciledAt: true },
		});
		expect(persisted?.reconciledAt).toBeNull();
	});
});

async function createFixture(): Promise<Fixture> {
	const companyId = randomUUID();
	const accountId = randomUUID();
	const transactionId = randomUUID();

	await db.insert(bankAccounts).values({
		id: accountId,
		companyId,
		accountName: "Integration Account",
		accountNumber: `999-${randomUUID().slice(0, 8)}`,
		accountType: "CHECKING",
		bankName: "Integration Bank",
		bankCode: "INT",
		currency: "PEN",
		currentBalance: "0",
		availableBalance: "0",
		isActive: true,
		isDefault: false,
	});

	await db.insert(bankTransactions).values({
		id: transactionId,
		companyId,
		accountId,
		transactionDate: "2026-02-10",
		description: "Integration transaction",
		reference: null,
		type: "EXPENSE",
		amount: "118.00",
		balance: null,
		category: null,
		tags: null,
		isReconciled: false,
		reconciledAt: null,
		reconciledBy: null,
		invoiceId: null,
		billId: null,
		importedFrom: "INTEGRATION_TEST",
	});

	const fixture: Fixture = {
		companyId,
		accountId,
		transactionId,
	};
	return fixture;
}
