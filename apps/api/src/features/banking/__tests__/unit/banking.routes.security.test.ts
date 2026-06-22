import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bankingRoutes } from "../../api/banking.routes";
import { BankingApplicationService } from "../../application/services/banking.application-service";
import {
	BankingRepository,
	type BankTransactionRecord,
} from "../../infrastructure/banking.repository";

type AccountResult = Awaited<
	ReturnType<BankingApplicationService["getAccount"]>
>;
type BalanceResult = Awaited<
	ReturnType<BankingApplicationService["getBalance"]>
>;
type TransactionListResult = Awaited<
	ReturnType<BankingApplicationService["listTransactions"]>
>;

const ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440001";
const TRANSACTION_ID = "550e8400-e29b-41d4-a716-446655440002";
const USER_ID = "550e8400-e29b-41d4-a716-446655440003";

function makeAccount(companyId = "cmp-2"): AccountResult {
	return {
		id: ACCOUNT_ID,
		companyId,
		accountName: "BCP Principal",
		accountNumber: "191-1234567-0-11",
		accountType: "CHECKING",
		bankName: "BCP",
		bankCode: "002",
		branch: null,
		currency: "PEN",
		currentBalance: "1000.0000",
		availableBalance: "1000.0000",
		isActive: true,
		isDefault: false,
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	};
}

function makeTransaction(companyId = "cmp-2"): BankTransactionRecord {
	return {
		id: TRANSACTION_ID,
		companyId,
		accountId: ACCOUNT_ID,
		transactionDate: "2026-01-15",
		description: "Pago proveedor",
		reference: null,
		type: "DEBIT",
		amount: "100.0000",
		balance: "900.0000",
		category: null,
		tags: null,
		isReconciled: false,
		reconciledAt: null,
		reconciledBy: null,
		invoiceId: null,
		billId: null,
		createdAt: new Date("2026-01-15T00:00:00.000Z"),
		importedFrom: "MANUAL",
	};
}

describe("bankingRoutes object-level tenant scope", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("rejects cross-tenant account GET before returning the object", async () => {
		vi.spyOn(
			BankingApplicationService.prototype,
			"getAccount",
		).mockResolvedValue(makeAccount("cmp-2"));

		const app = new Elysia().use(bankingRoutes);
		const response = await app.handle(
			new Request(`http://localhost/api/banking/accounts/${ACCOUNT_ID}`, {
				headers: { "x-company-id": "cmp-1" },
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("rejects cross-tenant balance GET before computing balance", async () => {
		vi.spyOn(
			BankingApplicationService.prototype,
			"getAccount",
		).mockResolvedValue(makeAccount("cmp-2"));
		const getBalanceSpy = vi
			.spyOn(BankingApplicationService.prototype, "getBalance")
			.mockResolvedValue({
				current: "1000.0000",
				available: "1000.0000",
			} satisfies BalanceResult);

		const app = new Elysia().use(bankingRoutes);
		const response = await app.handle(
			new Request(
				`http://localhost/api/banking/accounts/${ACCOUNT_ID}/balance`,
				{
					headers: { "x-company-id": "cmp-1" },
				},
			),
		);

		expect(response.status).toBe(401);
		expect(getBalanceSpy).not.toHaveBeenCalled();
	});

	it("rejects cross-tenant account DELETE before soft delete", async () => {
		vi.spyOn(
			BankingApplicationService.prototype,
			"getAccount",
		).mockResolvedValue(makeAccount("cmp-2"));
		const deleteSpy = vi
			.spyOn(BankingApplicationService.prototype, "deleteAccount")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(bankingRoutes);
		const response = await app.handle(
			new Request(`http://localhost/api/banking/accounts/${ACCOUNT_ID}`, {
				method: "DELETE",
				headers: { "x-company-id": "cmp-1" },
			}),
		);

		expect(response.status).toBe(401);
		expect(deleteSpy).not.toHaveBeenCalled();
	});

	it("rejects cross-tenant transaction listing before querying transactions", async () => {
		vi.spyOn(
			BankingApplicationService.prototype,
			"getAccount",
		).mockResolvedValue(makeAccount("cmp-2"));
		const listTransactionsSpy = vi
			.spyOn(BankingApplicationService.prototype, "listTransactions")
			.mockResolvedValue([] satisfies TransactionListResult);

		const app = new Elysia().use(bankingRoutes);
		const response = await app.handle(
			new Request(
				`http://localhost/api/banking/accounts/${ACCOUNT_ID}/transactions`,
				{
					headers: { "x-company-id": "cmp-1" },
				},
			),
		);

		expect(response.status).toBe(401);
		expect(listTransactionsSpy).not.toHaveBeenCalled();
	});

	it("rejects cross-tenant transaction reconcile before command execution", async () => {
		vi.spyOn(
			BankingRepository.prototype,
			"findTransactionById",
		).mockResolvedValue(makeTransaction("cmp-2"));
		const reconcileSpy = vi
			.spyOn(BankingApplicationService.prototype, "reconcileTransaction")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(bankingRoutes);
		const response = await app.handle(
			new Request(
				`http://localhost/api/banking/transactions/${TRANSACTION_ID}/reconcile`,
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
						"x-company-id": "cmp-1",
					},
					body: JSON.stringify({ userId: USER_ID }),
				},
			),
		);

		expect(response.status).toBe(401);
		expect(reconcileSpy).not.toHaveBeenCalled();
	});
});
