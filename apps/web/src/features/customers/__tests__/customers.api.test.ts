import { beforeEach, describe, expect, it, vi } from "vitest";

const { customersGet, customersPost } = vi.hoisted(() => ({
	customersGet: vi.fn(),
	customersPost: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	api: { api: { customers: { get: customersGet, post: customersPost } } },
}));

import { customersApi } from "../api/customers.api";

describe("customersApi.list", () => {
	beforeEach(() => {
		customersGet.mockReset();
	});

	it("asks for the given company and returns its customers", async () => {
		const customer = {
			id: "c-1",
			companyId: "cmp-1",
			taxId: "20100000001",
			legalName: "CLIENTE A S.A.C.",
		};
		customersGet.mockResolvedValue({
			data: { success: true, data: [customer] },
			error: null,
		});

		await expect(customersApi.list({ companyId: "cmp-1" })).resolves.toEqual([
			customer,
		]);
		expect(customersGet).toHaveBeenCalledWith({
			query: { companyId: "cmp-1" },
		});
	});

	it("fails when the API answers with an error envelope", async () => {
		customersGet.mockResolvedValue({
			data: { success: false, error: "boom" },
			error: null,
		});

		await expect(customersApi.list({ companyId: "cmp-1" })).rejects.toThrow();
	});
});

describe("customersApi.create", () => {
	beforeEach(() => {
		customersPost.mockReset();
	});

	it("registers the customer in the given company", async () => {
		const customer = {
			id: "c-2",
			companyId: "cmp-1",
			taxId: "20100070970",
			legalName: "NUEVO S.A.C.",
		};
		customersPost.mockResolvedValue({
			data: { success: true, data: customer },
			error: null,
		});

		await expect(
			customersApi.create({
				companyId: "cmp-1",
				taxId: "20100070970",
				legalName: "NUEVO S.A.C.",
			}),
		).resolves.toEqual(customer);
		expect(customersPost).toHaveBeenCalledWith({
			companyId: "cmp-1",
			taxId: "20100070970",
			legalName: "NUEVO S.A.C.",
		});
	});

	it("passes on why the API refused it", async () => {
		customersPost.mockResolvedValue({
			data: null,
			error: {
				status: 409,
				value: {
					success: false,
					error: "Ya existe un cliente con ese RUC en la empresa",
					code: "CUSTOMER_EXISTS",
				},
			},
		});

		await expect(
			customersApi.create({
				companyId: "cmp-1",
				taxId: "20100070970",
				legalName: "NUEVO S.A.C.",
			}),
		).rejects.toThrow("Ya existe un cliente con ese RUC en la empresa");
	});
});
