import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getCustomerExecute: vi.fn(),
	updateCustomerExecute: vi.fn(),
	deleteCustomerExecute: vi.fn(),
}));

vi.mock("../../application/queries/get-customer.query", () => ({
	GetCustomerQuery: class {
		execute = mocks.getCustomerExecute;
	},
}));

vi.mock("../../application/commands/update-customer.command", () => ({
	UpdateCustomerCommand: class {
		execute = mocks.updateCustomerExecute;
	},
}));

vi.mock("../../application/commands/delete-customer.command", () => ({
	DeleteCustomerCommand: class {
		execute = mocks.deleteCustomerExecute;
	},
}));

import { customerRoutes } from "../../api/routes";

const app = new Elysia().use(customerRoutes);

describe("customerRoutes tenant object authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fails closed when object GET omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1"),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.getCustomerExecute).not.toHaveBeenCalled();
	});

	it("passes object GET through the scoped company loader", async () => {
		mocks.getCustomerExecute.mockResolvedValueOnce({
			customer: {
				toJSON: () => ({ id: "customer-1", companyId: "company-1" }),
			},
			invoices: undefined,
		});

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				headers: { "X-Company-Id": "company-1" },
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.getCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: "company-1",
			includeInvoices: undefined,
			invoiceLimit: undefined,
		});
	});

	it("returns not found instead of leaking cross-tenant customers", async () => {
		mocks.getCustomerExecute.mockRejectedValueOnce(
			new Error("Cliente no encontrado"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				headers: { "X-Company-Id": "other-company" },
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "CUSTOMER_NOT_FOUND",
		});
	});

	it("fails closed when object PATCH omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ legalName: "Empresa Actualizada SAC" }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.updateCustomerExecute).not.toHaveBeenCalled();
	});

	it("passes object PATCH through the scoped company command", async () => {
		mocks.updateCustomerExecute.mockResolvedValueOnce({
			toJSON: () => ({ id: "customer-1", companyId: "company-1" }),
		});

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"X-Company-Id": "company-1",
				},
				body: JSON.stringify({ legalName: "Empresa Actualizada SAC" }),
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.updateCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: "company-1",
			legalName: "Empresa Actualizada SAC",
		});
	});

	it("returns not found instead of updating cross-tenant customers", async () => {
		mocks.updateCustomerExecute.mockRejectedValueOnce(
			new Error("Cliente no encontrado"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"X-Company-Id": "other-company",
				},
				body: JSON.stringify({ legalName: "Empresa Actualizada SAC" }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "CUSTOMER_NOT_FOUND",
		});
	});

	it("fails closed when object DELETE omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "DELETE",
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.deleteCustomerExecute).not.toHaveBeenCalled();
	});

	it("passes object DELETE through the scoped company command", async () => {
		mocks.deleteCustomerExecute.mockResolvedValueOnce({
			toJSON: () => ({ id: "customer-1", companyId: "company-1" }),
		});

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "DELETE",
				headers: { "X-Company-Id": "company-1" },
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.deleteCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: "company-1",
		});
	});

	it("returns not found instead of deleting cross-tenant customers", async () => {
		mocks.deleteCustomerExecute.mockRejectedValueOnce(
			new Error("Cliente no encontrado"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/customers/customer-1", {
				method: "DELETE",
				headers: { "X-Company-Id": "other-company" },
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "CUSTOMER_NOT_FOUND",
		});
	});
});
