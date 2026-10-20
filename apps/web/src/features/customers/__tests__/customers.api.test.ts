import { beforeEach, describe, expect, it, vi } from "vitest";

const { customersGet } = vi.hoisted(() => ({ customersGet: vi.fn() }));

vi.mock("@/lib/api-client", () => ({
	api: { api: { customers: { get: customersGet } } },
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
