import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { transactionsRoutes } from "../../api/routes";

const COMPANY_ID = "company-1";

const handlerMocks = vi.hoisted(() => ({
	createExecute: vi.fn(),
	updateExecute: vi.fn(),
	deleteExecute: vi.fn(),
	listExecute: vi.fn(),
	getExecute: vi.fn(),
	summaryExecute: vi.fn(),
}));

vi.mock("../../infrastructure/transaction.repository", () => ({
	transactionRepository: {},
}));

vi.mock("../../application/commands/create-transaction.handler", () => ({
	CreateTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.createExecute,
	})),
}));

vi.mock("../../application/commands/update-transaction.handler", () => ({
	UpdateTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.updateExecute,
	})),
}));

vi.mock("../../application/commands/delete-transaction.handler", () => ({
	DeleteTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.deleteExecute,
	})),
}));

vi.mock("../../application/queries/list-transactions.handler", () => ({
	ListTransactionsHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.listExecute,
	})),
}));

vi.mock("../../application/queries/get-transaction.handler", () => ({
	GetTransactionHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.getExecute,
	})),
}));

vi.mock("../../application/queries/get-summary.handler", () => ({
	GetSummaryHandler: vi.fn().mockImplementation(() => ({
		execute: handlerMocks.summaryExecute,
	})),
}));

function scopedRequest(path: string, init: RequestInit = {}): Request {
	return new Request(`http://localhost${path}`, {
		...init,
		headers: {
			"x-company-id": COMPANY_ID,
			...(init.headers instanceof Headers
				? Object.fromEntries(init.headers.entries())
				: init.headers),
		},
	});
}

describe("transactions tenant scope", () => {
	const app = new Elysia().use(transactionsRoutes);

	beforeEach(() => {
		vi.clearAllMocks();
		handlerMocks.createExecute.mockResolvedValue({ id: "tx-1" });
		handlerMocks.updateExecute.mockResolvedValue({ id: "tx-1" });
		handlerMocks.deleteExecute.mockResolvedValue({ success: true });
		handlerMocks.listExecute.mockResolvedValue([]);
		handlerMocks.getExecute.mockResolvedValue({ id: "tx-1" });
		handlerMocks.summaryExecute.mockResolvedValue({});
	});

	it("rejects list requests without company context", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/transactions"),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
		expect(handlerMocks.listExecute).not.toHaveBeenCalled();
	});

	it("rejects read queries without company context", async () => {
		await app.handle(
			scopedRequest("/api/transactions?type=EXPENSE&partnerId=partner-1"),
		);
		await app.handle(scopedRequest("/api/transactions/summary"));
		await app.handle(scopedRequest("/api/transactions/tx-1"));

		expect(handlerMocks.listExecute).not.toHaveBeenCalled();
		expect(handlerMocks.summaryExecute).not.toHaveBeenCalled();
		expect(handlerMocks.getExecute).not.toHaveBeenCalled();
	});

	it("rejects mutation handlers without company context", async () => {
		await app.handle(
			scopedRequest("/api/transactions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "body-company-must-not-win",
					type: "EXPENSE",
					partnerId: "partner-1",
					totalAmount: "100.00",
					currency: "PEN",
					hasDetraction: false,
				}),
			}),
		);
		await app.handle(
			scopedRequest("/api/transactions/tx-1", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ totalAmount: "200.00" }),
			}),
		);
		await app.handle(
			scopedRequest("/api/transactions/tx-1", { method: "DELETE" }),
		);

		expect(handlerMocks.createExecute).not.toHaveBeenCalled();
		expect(handlerMocks.updateExecute).not.toHaveBeenCalled();
		expect(handlerMocks.deleteExecute).not.toHaveBeenCalled();
	});

	it("rejects create requests without company context", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/transactions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "body-company-must-not-win",
					type: "EXPENSE",
					partnerId: "partner-1",
					totalAmount: "100.00",
					currency: "PEN",
					hasDetraction: false,
				}),
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
		expect(handlerMocks.createExecute).not.toHaveBeenCalled();
	});
});
