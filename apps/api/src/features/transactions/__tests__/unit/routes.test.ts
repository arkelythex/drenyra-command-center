import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { transactionsRoutes } from "../../api/routes";

vi.mock("../../infrastructure/transaction.repository", () => ({
	transactionRepository: {},
}));

vi.mock("../../application/commands/create-transaction.handler", () => ({
	CreateTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue({
			id: "tx-1",
			igvAmount: "4.00",
		}),
	})),
}));

vi.mock("../../application/commands/update-transaction.handler", () => ({
	UpdateTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue({
			id: "tx-1",
		}),
	})),
}));

vi.mock("../../application/commands/delete-transaction.handler", () => ({
	DeleteTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue({ success: true }),
	})),
}));

vi.mock("../../application/queries/list-transactions.handler", () => ({
	ListTransactionsHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock("../../application/queries/get-transaction.handler", () => ({
	GetTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue(null),
	})),
}));

vi.mock("../../application/queries/get-summary.handler", () => ({
	GetSummaryHandler: vi.fn().mockImplementation(() => ({
		execute: vi.fn().mockResolvedValue({}),
	})),
}));

describe("transactions routes (VSA)", () => {
	const app = new Elysia().use(transactionsRoutes);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("accepts detractionProfile in POST /transactions", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/transactions", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "company-1",
				},
				body: JSON.stringify({
					companyId: "company-1",
					type: "EXPENSE",
					partnerId: "partner-1",
					totalAmount: "100.00",
					currency: "PEN",
					hasDetraction: true,
					detractionProfile: "TRANSPORT",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				id: "tx-1",
			},
		});
	});

	it("returns 422 when detractionProfile is invalid in POST /transactions", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/transactions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "company-1",
					type: "EXPENSE",
					partnerId: "partner-1",
					totalAmount: "100.00",
					currency: "PEN",
					hasDetraction: true,
					detractionProfile: "INVALID_PROFILE",
				}),
			}),
		);

		expect(response.status).toBe(422);
	});

	it("accepts detractionProfile in PATCH /transactions/:id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/transactions/tx-1", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					detractionProfile: "CONSTRUCTION",
				}),
			}),
		);

		expect(response.status).toBe(200);
	});
});
