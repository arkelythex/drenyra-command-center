/**
 * Banking Handlers E2E Integration Tests
 *
 * Tests the full HTTP stack: Elysia -> Handlers -> Services -> Repository -> DB
 * Uses real database and real HTTP requests.
 */

// Apply integration test mocks FIRST
import "./integration-mocks";

import { randomUUID } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { asc, eq } from "@drenyra/persistence/query";
import { bankAccounts, bankTransactions } from "@drenyra/persistence/schema";
import { Elysia } from "elysia";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { bankingRoutes } from "../../api/banking.routes";

// Signed in as a user of the fixture's company: the routes refuse any other.
const session = vi.hoisted(() => ({ companyId: "" }));
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(async () => ({
		ok: true,
		context: {
			userId: "user-1",
			authUserId: "user-1",
			legacyUserId: null,
			role: "admin",
			companyId: session.companyId,
		},
	})),
}));

import {
	createTestAccount,
	createTestTransaction,
	describeBankingIntegration,
	setupTestDb,
} from "./test-db-setup";

async function expectSuccessData<T = unknown>(response: Response): Promise<T> {
	const payload = await response.json();
	expect(payload).toMatchObject({ success: true });
	return payload.data as T;
}

describeBankingIntegration("Banking Handlers (E2E)", () => {
	const getCtx = setupTestDb();
	let app: Elysia;

	beforeEach(() => {
		session.companyId = getCtx().companyId;
	});

	beforeAll(() => {
		// Create Elysia test app with banking routes
		app = new Elysia().use(bankingRoutes);
	});

	describe("GET /api/banking/accounts", () => {
		it("lists accounts for company", async () => {
			const ctx = getCtx();
			await createTestAccount(ctx, { accountName: "Account 1" });
			await createTestAccount(ctx, { accountName: "Account 2" });

			const response = await app.handle(
				new Request(
					`http://localhost/api/banking/accounts?companyId=${ctx.companyId}`,
				),
			);

			expect(response.status).toBe(200);
			const accounts =
				await expectSuccessData<Array<Record<string, unknown>>>(response);
			expect(accounts).toHaveLength(2);
			expect(accounts[0]).toHaveProperty("id");
			expect(accounts[0]).toHaveProperty("accountName");
		});

		it("returns 422 for missing companyId", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/banking/accounts"),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("POST /api/banking/accounts", () => {
		it("creates account with valid data", async () => {
			const ctx = getCtx();

			const response = await app.handle(
				new Request("http://localhost/api/banking/accounts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: ctx.companyId,
						accountName: "BCP Principal",
						accountNumber: "191-1234567-0-11",
						accountType: "CHECKING",
						bankName: "BCP",
						bankCode: "002",
						currency: "PEN",
					}),
				}),
			);

			expect(response.status).toBe(200);
			const account =
				await expectSuccessData<Record<string, unknown>>(response);
			expect(account).toHaveProperty("id");
			expect(account.accountName).toBe("BCP Principal");
			expect(account.currency).toBe("PEN");

			ctx.addAccount(account.id);
		});

		it("validates required fields", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/banking/accounts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: "test",
						accountName: "Test",
						// Missing accountNumber
						accountType: "CHECKING",
						bankName: "Test Bank",
					}),
				}),
			);

			expect(response.status).toBe(422);
		});

		it("validates account type enum", async () => {
			const ctx = getCtx();

			const response = await app.handle(
				new Request("http://localhost/api/banking/accounts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: ctx.companyId,
						accountName: "Test",
						accountNumber: "123456",
						accountType: "INVALID",
						bankName: "Test Bank",
					}),
				}),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("GET /api/banking/accounts/:id", () => {
		it("returns account by ID", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx, {
				accountName: "Find Me",
			});

			const response = await app.handle(
				new Request(`http://localhost/api/banking/accounts/${account.id}`, {
					headers: { "x-company-id": ctx.companyId },
				}),
			);

			expect(response.status).toBe(200);
			const found = await expectSuccessData<Record<string, unknown>>(response);
			expect(found.id).toBe(account.id);
			expect(found.accountName).toBe("Find Me");
		});

		it("returns 404 for non-existent account", async () => {
			const nonExistentId = randomUUID();
			const response = await app.handle(
				new Request(`http://localhost/api/banking/accounts/${nonExistentId}`, {
					headers: { "x-company-id": getCtx().companyId },
				}),
			);

			expect(response.status).toBe(404);
		});
	});

	describe("GET /api/banking/accounts/:id/balance", () => {
		it("returns account balance", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx, {
				currentBalance: "5000.00",
				availableBalance: "4800.00",
				currency: "PEN",
			});

			const response = await app.handle(
				new Request(
					`http://localhost/api/banking/accounts/${account.id}/balance`,
					{
						headers: { "x-company-id": ctx.companyId },
					},
				),
			);

			expect(response.status).toBe(200);
			const balance =
				await expectSuccessData<Record<string, unknown>>(response);
			expect(balance).toMatchObject({
				current: "5000.0000",
				available: "4800.0000",
			});
		});
	});

	describe("DELETE /api/banking/accounts/:id", () => {
		it("soft deletes account", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx);

			const response = await app.handle(
				new Request(`http://localhost/api/banking/accounts/${account.id}`, {
					method: "DELETE",
					headers: { "x-company-id": ctx.companyId },
				}),
			);

			expect(response.status).toBe(200);
			const result = await expectSuccessData<Record<string, unknown>>(response);
			expect(result.deleted).toBe(true);
		});
	});

	describe("POST /api/banking/transactions", () => {
		it("creates transaction with valid data", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx, {
				currentBalance: "2000",
				availableBalance: "2000",
			});

			const response = await app.handle(
				new Request("http://localhost/api/banking/transactions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: ctx.companyId,
						accountId: account.id,
						transactionDate: "2026-01-15",
						description: "Pago de proveedor",
						reference: "FAC-001",
						type: "DEBIT",
						amount: 1500.0,
						category: "PAYMENTS",
					}),
				}),
			);

			expect(response.status).toBe(200);
			const transaction =
				await expectSuccessData<Record<string, unknown>>(response);
			expect(transaction).toHaveProperty("id");
			expect(transaction.description).toBe("Pago de proveedor");
			expect(transaction.amount).toBe("1500.0000");

			ctx.addTransaction(transaction.id);
		});

		it("validates transaction type enum", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx);

			const response = await app.handle(
				new Request("http://localhost/api/banking/transactions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: ctx.companyId,
						accountId: account.id,
						transactionDate: "2026-01-15",
						description: "Test",
						type: "INVALID",
						amount: 100,
					}),
				}),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("GET /api/banking/accounts/:id/transactions", () => {
		it("lists transactions for account", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx);
			await createTestTransaction(ctx, account.id, {
				description: "Transaction 1",
			});
			await createTestTransaction(ctx, account.id, {
				description: "Transaction 2",
			});

			const response = await app.handle(
				new Request(
					`http://localhost/api/banking/accounts/${account.id}/transactions`,
					{
						headers: { "x-company-id": ctx.companyId },
					},
				),
			);

			expect(response.status).toBe(200);
			const transactions =
				await expectSuccessData<Array<Record<string, unknown>>>(response);
			expect(transactions.length).toBeGreaterThanOrEqual(2);
			expect(transactions[0]).toHaveProperty("id");
			expect(transactions[0]).toHaveProperty("description");
		});

		it("filters transactions by date range", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx);
			await createTestTransaction(ctx, account.id, {
				transactionDate: "2026-01-10",
			});
			await createTestTransaction(ctx, account.id, {
				transactionDate: "2026-01-20",
			});

			const response = await app.handle(
				new Request(
					`http://localhost/api/banking/accounts/${account.id}/transactions?startDate=2026-01-15&endDate=2026-01-25`,
					{ headers: { "x-company-id": ctx.companyId } },
				),
			);

			expect(response.status).toBe(200);
			const transactions =
				await expectSuccessData<Array<Record<string, unknown>>>(response);
			expect(transactions.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("GET /api/banking/summary", () => {
		it("returns banking summary for company", async () => {
			const ctx = getCtx();
			const account = await createTestAccount(ctx, {
				currentBalance: "10000.00",
			});
			await createTestTransaction(ctx, account.id, { isReconciled: false });
			await createTestTransaction(ctx, account.id, { isReconciled: false });

			const response = await app.handle(
				new Request(
					`http://localhost/api/banking/summary?companyId=${ctx.companyId}`,
				),
			);

			expect(response.status).toBe(200);
			const summary =
				await expectSuccessData<Record<string, unknown>>(response);
			expect(summary).toHaveProperty("totalAccounts");
			expect(summary).toHaveProperty("totalBalance");
			expect(summary).toHaveProperty("unreconciledTransactions");
			expect(summary.totalAccounts).toBeGreaterThanOrEqual(1);
		});
	});

	describe("POST /api/banking/import", () => {
		async function importStatement(
			accountId: string,
			transactions: Array<Record<string, unknown>>,
		) {
			return app.handle(
				new Request("http://localhost/api/banking/import", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: getCtx().companyId,
						accountId,
						transactions,
					}),
				}),
			);
		}

		const statement = [
			{
				date: "2026-01-10",
				description: "COMISION MANTENIMIENTO",
				amountCents: 1500,
				type: "DEBIT",
			},
			{
				date: "2026-01-11",
				description: "ABONO F001-123",
				reference: "F001-123",
				amountCents: 118010,
				type: "CREDIT",
			},
		];

		async function storedFor(accountId: string) {
			const rows = await db
				.select({
					amount: bankTransactions.amount,
					balance: bankTransactions.balance,
				})
				.from(bankTransactions)
				.where(eq(bankTransactions.accountId, accountId))
				.orderBy(asc(bankTransactions.transactionDate));
			const [account] = await db
				.select({ currentBalance: bankAccounts.currentBalance })
				.from(bankAccounts)
				.where(eq(bankAccounts.id, accountId));
			return { rows, balance: account?.currentBalance };
		}

		it("imports a statement in cents, even when it starts with a fee", async () => {
			const account = await createTestAccount(getCtx(), {
				currentBalance: "0.0000",
			});

			const response = await importStatement(account.id, statement);

			expect(response.status).toBe(200);
			expect(await expectSuccessData(response)).toMatchObject({
				imported: 2,
				skipped: 0,
			});
			const stored = await storedFor(account.id);
			expect(stored.rows).toEqual([
				{ amount: "15.0000", balance: "-15.0000" },
				{ amount: "1180.1000", balance: "1165.1000" },
			]);
			expect(stored.balance).toBe("1165.1000");
		});

		it("adds nothing when the same statement is imported again", async () => {
			const account = await createTestAccount(getCtx(), {
				currentBalance: "0.0000",
			});
			await importStatement(account.id, statement);

			const again = await importStatement(account.id, statement);

			expect(await expectSuccessData(again)).toMatchObject({
				imported: 0,
				skipped: 2,
			});
			expect((await storedFor(account.id)).rows).toHaveLength(2);
		});

		it("refuses amounts that are not whole cents", async () => {
			const account = await createTestAccount(getCtx());

			const response = await importStatement(account.id, [
				{ ...statement[0], amountCents: 1000.5 },
			]);

			expect(response.status).toBe(422);
			expect((await storedFor(account.id)).rows).toHaveLength(0);
		});

		it("answers 404 for an account of another company", async () => {
			const response = await importStatement(randomUUID(), statement);

			expect(response.status).toBe(404);
		});
	});
});
