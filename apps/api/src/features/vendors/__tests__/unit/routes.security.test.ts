import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVendor: vi.fn(),
	updateVendor: vi.fn(),
	deleteVendor: vi.fn(),
}));

vi.mock("../../application/queries/get-vendor.query", () => ({
	getVendor: mocks.getVendor,
}));

vi.mock("../../application/commands/update-vendor.command", () => ({
	updateVendor: mocks.updateVendor,
}));

vi.mock("../../application/commands/delete-vendor.command", () => ({
	deleteVendor: mocks.deleteVendor,
}));

import { vendorRoutes } from "../../api/routes";

const app = new Elysia().use(vendorRoutes);

describe("vendorRoutes tenant object authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fails closed when object GET omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1"),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.getVendor).not.toHaveBeenCalled();
	});

	it("passes object GET through the scoped company query", async () => {
		mocks.getVendor.mockResolvedValueOnce({
			toJSON: () => ({ id: "vendor-1", companyId: "company-1" }),
		});

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				headers: { "X-Company-Id": "company-1" },
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.getVendor).toHaveBeenCalledWith({
			id: "vendor-1",
			companyId: "company-1",
		});
	});

	it("returns not found instead of leaking cross-tenant vendors", async () => {
		mocks.getVendor.mockRejectedValueOnce(new Error("Proveedor no encontrado"));

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				headers: { "X-Company-Id": "other-company" },
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "VENDOR_NOT_FOUND",
		});
	});

	it("fails closed when object PATCH omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ legalName: "Proveedor Actualizado SAC" }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.updateVendor).not.toHaveBeenCalled();
	});

	it("passes object PATCH through the scoped company command", async () => {
		mocks.updateVendor.mockResolvedValueOnce({
			toJSON: () => ({ id: "vendor-1", companyId: "company-1" }),
		});

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"X-Company-Id": "company-1",
				},
				body: JSON.stringify({ legalName: "Proveedor Actualizado SAC" }),
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.updateVendor).toHaveBeenCalledWith({
			id: "vendor-1",
			companyId: "company-1",
			legalName: "Proveedor Actualizado SAC",
		});
	});

	it("returns not found instead of updating cross-tenant vendors", async () => {
		mocks.updateVendor.mockRejectedValueOnce(
			new Error("Proveedor no encontrado"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"X-Company-Id": "other-company",
				},
				body: JSON.stringify({ legalName: "Proveedor Actualizado SAC" }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "VENDOR_NOT_FOUND",
		});
	});

	it("fails closed when object DELETE omits X-Company-Id", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "DELETE",
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_REQUIRED",
		});
		expect(mocks.deleteVendor).not.toHaveBeenCalled();
	});

	it("passes object DELETE through the scoped company command", async () => {
		mocks.deleteVendor.mockResolvedValueOnce({
			toJSON: () => ({ id: "vendor-1", companyId: "company-1" }),
		});

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "DELETE",
				headers: { "X-Company-Id": "company-1" },
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.deleteVendor).toHaveBeenCalledWith({
			id: "vendor-1",
			companyId: "company-1",
		});
	});

	it("returns not found instead of deleting cross-tenant vendors", async () => {
		mocks.deleteVendor.mockRejectedValueOnce(
			new Error("Proveedor no encontrado"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/vendors/vendor-1", {
				method: "DELETE",
				headers: { "X-Company-Id": "other-company" },
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			code: "VENDOR_NOT_FOUND",
		});
	});
});
