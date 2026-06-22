import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listInvoicesRoute } from "../../api/routes/list.route";

const executeMock = vi.hoisted(() => vi.fn());
const loadInvoiceElectronicSummariesMock = vi.hoisted(() => vi.fn());

vi.mock("../../application/queries/list-invoices.query", () => ({
	listInvoices: executeMock,
	ListInvoicesQuery: class MockListInvoicesQuery {
		execute = executeMock;
	},
}));

vi.mock("../../api/handlers/invoice-electronic-summary", () => ({
	loadInvoiceElectronicSummaries: loadInvoiceElectronicSummariesMock,
}));

describe("listInvoicesRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loadInvoiceElectronicSummariesMock.mockResolvedValue(
			new Map([
				[
					"inv-1",
					{
						transactionId: "tx-1",
						transactionStatus: "ACCEPTED",
						sunatStatus: "ACCEPTED",
						sunatCode: "0",
						sunatMessage: "CDR aceptado",
					},
				],
			]),
		);
	});

	it("includes persisted SUNAT artifacts in the list payload", async () => {
		executeMock.mockResolvedValue({
			invoices: [
				{
					id: "inv-1",
					invoiceNumber: "F001-00000001",
					customerId: "cust-1",
					issueDate: new Date("2026-03-01T00:00:00.000Z"),
					dueDate: new Date("2026-03-15T00:00:00.000Z"),
					totalAmount: "118.00",
					balanceDue: "118.00",
					status: "SENT",
					currency: "PEN",
					sunatCdr: "https://ose.example.test/cdr/F001-00000001.zip",
					sunatTicket: "TKT-2026-000001",
				},
			],
			total: 1,
			limit: 20,
			offset: 0,
		});

		const app = new Elysia().use(listInvoicesRoute);
		const response = await app.handle(
			new Request("http://localhost/?companyId=company-1"),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			success: true,
			data: {
				invoices: [
					{
						id: "inv-1",
						transactionId: "tx-1",
						sunatCdr: "https://ose.example.test/cdr/F001-00000001.zip",
						sunatTicket: "TKT-2026-000001",
						sunatStatus: "ACCEPTED",
						sunatCode: "0",
						sunatMessage: "CDR aceptado",
					},
				],
			},
		});
	});
});
