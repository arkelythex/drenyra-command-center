/**
 * Customers belong to one company: only a signed-in member of that company
 * may list, create, read, change or delete them. The company comes from the
 * session, never from a header or parameter the caller can forge.
 */
import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
	createCustomerExecute: vi.fn(),
	listCustomersExecute: vi.fn(),
	getCustomerExecute: vi.fn(),
	updateCustomerExecute: vi.fn(),
	deleteCustomerExecute: vi.fn(),
}));

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: mocks.resolveSessionContext,
}));

vi.mock("../../application/commands/create-customer.command", () => ({
	CreateCustomerCommand: class {
		execute = mocks.createCustomerExecute;
	},
}));

vi.mock("../../application/queries/list-customers.query", () => ({
	ListCustomersQuery: class {
		execute = mocks.listCustomersExecute;
	},
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

const OWN = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "22222222-2222-4222-8222-222222222222";
const app = new Elysia().use(customerRoutes);

function signedIn(companyId = OWN) {
	mocks.resolveSessionContext.mockResolvedValue({
		ok: true,
		context: {
			userId: "user-1",
			authUserId: "user-1",
			legacyUserId: null,
			role: "admin",
			companyId,
		},
	});
}

function signedOut() {
	mocks.resolveSessionContext.mockResolvedValue({
		ok: false,
		status: 401,
		error: "Unauthorized",
		code: "UNAUTHORIZED",
	});
}

function request(path: string, init: RequestInit = {}) {
	return app.handle(new Request(`http://localhost${path}`, init));
}

function json(method: string, body: unknown, headers: HeadersInit = {}) {
	return {
		method,
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	};
}

const NEW_CUSTOMER = { taxId: "20100070970", legalName: "CLIENTE SAC" };
const customer = (companyId = OWN) => ({
	toJSON: () => ({ id: "customer-1", companyId, ...NEW_CUSTOMER }),
});

describe("customer list and creation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("lists the session company's customers", async () => {
		signedIn();
		mocks.listCustomersExecute.mockResolvedValueOnce([customer()]);

		const response = await request(`/api/customers?companyId=${OWN}`);

		expect(response.status).toBe(200);
		expect(mocks.listCustomersExecute).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: OWN }),
		);
	});

	it("refuses to list another company's customers", async () => {
		signedIn();

		const response = await request(`/api/customers?companyId=${FOREIGN}`);

		expect(response.status).toBe(403);
		expect(mocks.listCustomersExecute).not.toHaveBeenCalled();
	});

	it("refuses to list without a session", async () => {
		signedOut();

		const response = await request(`/api/customers?companyId=${OWN}`);

		expect(response.status).toBe(403);
		expect(mocks.listCustomersExecute).not.toHaveBeenCalled();
	});

	it("creates a customer in the session company", async () => {
		signedIn();
		mocks.createCustomerExecute.mockResolvedValueOnce(customer());

		const response = await request(
			"/api/customers",
			json("POST", { companyId: OWN, ...NEW_CUSTOMER }),
		);

		expect(response.status).toBe(200);
		expect(mocks.createCustomerExecute).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: OWN, ...NEW_CUSTOMER }),
		);
	});

	it("refuses to create a customer for another company", async () => {
		signedIn();

		const response = await request(
			"/api/customers",
			json("POST", { companyId: FOREIGN, ...NEW_CUSTOMER }),
		);

		expect(response.status).toBe(403);
		expect(mocks.createCustomerExecute).not.toHaveBeenCalled();
	});

	it("refuses to create a customer without a session", async () => {
		signedOut();

		const response = await request(
			"/api/customers",
			json("POST", { companyId: OWN, ...NEW_CUSTOMER }),
		);

		expect(response.status).toBe(403);
		expect(mocks.createCustomerExecute).not.toHaveBeenCalled();
	});
});

describe("customer object routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		["GET", undefined],
		["PATCH", { legalName: "OTRO" }],
		["DELETE", undefined],
	])(
		"%s without a session is refused, even with X-Company-Id",
		async (method, body) => {
			signedOut();

			const response = await request(
				"/api/customers/customer-1",
				body
					? json(method, body, { "X-Company-Id": OWN })
					: { method, headers: { "X-Company-Id": OWN } },
			);

			expect(response.status).toBe(401);
			expect(await response.json()).toMatchObject({
				success: false,
				code: "COMPANY_SCOPE_REQUIRED",
			});
			expect(mocks.getCustomerExecute).not.toHaveBeenCalled();
			expect(mocks.updateCustomerExecute).not.toHaveBeenCalled();
			expect(mocks.deleteCustomerExecute).not.toHaveBeenCalled();
		},
	);

	it("reads within the session company, ignoring a forged X-Company-Id", async () => {
		signedIn();
		mocks.getCustomerExecute.mockResolvedValueOnce({
			customer: customer(),
			invoices: undefined,
		});

		const response = await request("/api/customers/customer-1", {
			headers: { "X-Company-Id": FOREIGN },
		});

		expect(response.status).toBe(200);
		expect(mocks.getCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: OWN,
			includeInvoices: undefined,
			invoiceLimit: undefined,
		});
	});

	it("updates within the session company", async () => {
		signedIn();
		mocks.updateCustomerExecute.mockResolvedValueOnce(customer());

		const response = await request(
			"/api/customers/customer-1",
			json("PATCH", { legalName: "OTRO" }, { "X-Company-Id": FOREIGN }),
		);

		expect(response.status).toBe(200);
		expect(mocks.updateCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: OWN,
			legalName: "OTRO",
		});
	});

	it("deletes within the session company", async () => {
		signedIn();
		mocks.deleteCustomerExecute.mockResolvedValueOnce(customer());

		const response = await request("/api/customers/customer-1", {
			method: "DELETE",
			headers: { "X-Company-Id": FOREIGN },
		});

		expect(response.status).toBe(200);
		expect(mocks.deleteCustomerExecute).toHaveBeenCalledWith({
			id: "customer-1",
			companyId: OWN,
		});
	});

	it("answers not found for a customer of another company", async () => {
		signedIn();
		mocks.getCustomerExecute.mockRejectedValueOnce(
			new Error("Cliente no encontrado"),
		);

		const response = await request("/api/customers/customer-1");

		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({
			code: "CUSTOMER_NOT_FOUND",
		});
	});
});
