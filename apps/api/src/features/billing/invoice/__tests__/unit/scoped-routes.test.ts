import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadInvoiceElectronicSummariesMock } = vi.hoisted(() => ({
	loadInvoiceElectronicSummariesMock: vi.fn(),
}));
vi.mock("../../api/handlers/invoice-electronic-summary", () => ({
	loadInvoiceElectronicSummaries: loadInvoiceElectronicSummariesMock,
}));

import { auth } from "../../../../auth/auth.config";
import { invoiceRoutes } from "../../api/routes";
import { ApplyPaymentCommand } from "../../application/commands/apply-payment.command";
import { DeleteInvoiceCommand } from "../../application/commands/delete-invoice.command";
import { UpdateInvoiceCommand } from "../../application/commands/update-invoice.command";
import { UpdateInvoiceStatusCommand } from "../../application/commands/update-invoice-status.command";
import { GetInvoiceQuery } from "../../application/queries/get-invoice.query";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

const app = new Elysia().use(invoiceRoutes);

const invoiceFixture = {
	id: "inv-1",
	companyId: "cmp-1",
	customerId: "customer-1",
	invoiceNumber: "F001-00000001",
	series: "F001",
	correlative: 1,
	issueDate: new Date("2026-02-20T00:00:00.000Z"),
	dueDate: new Date("2026-02-28T00:00:00.000Z"),
	currency: "PEN",
	exchangeRate: 1,
	subtotal: { toString: () => "84.75", toNumber: () => 84.75 },
	igvAmount: { toString: () => "15.25", toNumber: () => 15.25 },
	totalAmount: { toString: () => "100.00", toNumber: () => 100.0 },
	balanceDue: { toString: () => "100.00", toNumber: () => 100.0 },
	status: "DRAFT",
	notes: "Demo",
	items: [
		{
			id: "item-1",
			description: "Servicio contable",
			quantity: 1,
			unitPrice: { toString: () => "100.00" },
			taxType: "GRAVADO",
			igvRate: 18,
			subtotal: { toString: () => "84.75" },
			igvAmount: { toString: () => "15.25" },
			totalAmount: { toString: () => "100.00" },
		},
	],
	createdAt: new Date("2026-02-20T00:00:00.000Z"),
	updatedAt: new Date("2026-02-20T00:00:00.000Z"),
} as never;

afterEach(() => {
	vi.restoreAllMocks();
});

describe("invoice scoped routes", () => {
	beforeEach(() => {
		loadInvoiceElectronicSummariesMock.mockResolvedValue(new Map());
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);
		vi.spyOn(InvoiceRepository.prototype, "findById").mockResolvedValue(
			invoiceFixture,
		);
		vi.spyOn(InvoiceRepository.prototype, "updateStatus").mockResolvedValue(
			undefined,
		);
		vi.spyOn(InvoiceRepository.prototype, "applyPayment").mockResolvedValue(
			undefined,
		);
	});

	it("requires X-Company-Id before reading an invoice", async () => {
		const querySpy = vi.spyOn(GetInvoiceQuery.prototype, "execute");

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1"),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("blocks reads when tenant scope does not match the invoice", async () => {
		const querySpy = vi
			.spyOn(GetInvoiceQuery.prototype, "execute")
			.mockResolvedValue(invoiceFixture);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1", {
				headers: {
					"x-company-id": "cmp-other",
				},
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns the invoice when tenant scope matches", async () => {
		const querySpy = vi
			.spyOn(GetInvoiceQuery.prototype, "execute")
			.mockResolvedValue(invoiceFixture);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1", {
				headers: {
					"x-company-id": "cmp-1",
				},
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Company context is required",
		});
	});

	it("requires X-Company-Id before updating an invoice", async () => {
		const querySpy = vi.spyOn(GetInvoiceQuery.prototype, "execute");
		const updateSpy = vi.spyOn(UpdateInvoiceCommand.prototype, "execute");

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					customerId: "customer-1",
					issueDate: "2026-02-20",
					dueDate: "2026-02-28",
					currency: "PEN",
					items: [
						{
							description: "Servicio contable",
							quantity: "1",
							unitPrice: "100.00",
						},
					],
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		expect(updateSpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Company context is required",
		});
	});

	it("requires X-Company-Id before updating invoice status", async () => {
		const querySpy = vi.spyOn(GetInvoiceQuery.prototype, "execute");
		const commandSpy = vi.spyOn(
			UpdateInvoiceStatusCommand.prototype,
			"execute",
		);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					status: "SENT",
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		expect(commandSpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Company context is required",
		});
	});

	it("updates invoice status when tenant scope matches", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "owner",
				activeCompanyId: "cmp-1",
			},
		} as never);
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue(
			invoiceFixture,
		);
		const updateStatusSpy = vi.spyOn(
			InvoiceRepository.prototype,
			"updateStatus",
		);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-user-1",
					"x-user-id": "11111111-1111-1111-1111-111111111111",
				},
				body: JSON.stringify({
					status: "SENT",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(updateStatusSpy).toHaveBeenCalledWith(
			"inv-1",
			"SENT",
			"11111111-1111-1111-1111-111111111111",
		);
	});

	it("denies spoofable header-only context before updating invoice status", async () => {
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue(
			invoiceFixture,
		);
		const commandSpy = vi
			.spyOn(UpdateInvoiceStatusCommand.prototype, "execute")
			.mockResolvedValue(undefined);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-user-1",
					"x-user-id": "11111111-1111-1111-1111-111111111111",
				},
				body: JSON.stringify({
					status: "SENT",
				}),
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Active BetterAuth session is required for this operation",
			code: "SESSION_REQUIRED",
		});
		expect(commandSpy).not.toHaveBeenCalled();
	});

	it("denies spoofable header-only context when updating invoice status without session", async () => {
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue(
			invoiceFixture,
		);
		const commandSpy = vi
			.spyOn(UpdateInvoiceStatusCommand.prototype, "execute")
			.mockResolvedValue(undefined);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-user-1",
				},
				body: JSON.stringify({
					status: "SENT",
				}),
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Active BetterAuth session is required for this operation",
			code: "SESSION_REQUIRED",
		});
		expect(commandSpy).not.toHaveBeenCalled();
	});

	it("requires X-Company-Id before deleting an invoice", async () => {
		const querySpy = vi.spyOn(GetInvoiceQuery.prototype, "execute");
		const commandSpy = vi.spyOn(DeleteInvoiceCommand.prototype, "execute");

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1", {
				method: "DELETE",
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		expect(commandSpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Company context is required",
		});
	});

	it("requires X-Company-Id before applying a payment", async () => {
		const querySpy = vi.spyOn(GetInvoiceQuery.prototype, "execute");
		const commandSpy = vi.spyOn(ApplyPaymentCommand.prototype, "execute");

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(querySpy).not.toHaveBeenCalled();
		expect(commandSpy).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Company context is required",
		});
	});

	it("requires legacy actor context before applying a payment", async () => {
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue(
			invoiceFixture,
		);
		const commandSpy = vi.spyOn(ApplyPaymentCommand.prototype, "execute");

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-user-1",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
				}),
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Active BetterAuth session is required for this operation",
			code: "SESSION_REQUIRED",
		});
		expect(commandSpy).not.toHaveBeenCalled();
	});

	it("applies a payment when tenant scope and legacy actor context match", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "owner",
				activeCompanyId: "cmp-1",
			},
		} as never);
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue(
			invoiceFixture,
		);
		const applyPaymentSpy = vi.spyOn(
			InvoiceRepository.prototype,
			"applyPayment",
		);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-user-1",
					"x-user-id": "11111111-1111-1111-1111-111111111111",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(applyPaymentSpy).toHaveBeenCalledWith("inv-1", "100.00");
	});
});
