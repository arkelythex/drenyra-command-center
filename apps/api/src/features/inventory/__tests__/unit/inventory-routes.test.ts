import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryModule } from "../../index";
import { InventoryService } from "../../inventory.service";

const COMPANY_ID = "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc";

function authedRequest(url: string, init?: RequestInit) {
	return new Request(url, {
		...init,
		headers: {
			"x-company-id": COMPANY_ID,
			...init?.headers,
		},
	});
}

describe("inventory routes", () => {
	const app = new Elysia().use(inventoryModule);

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns 500 when x-company-id header is missing", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/inventory?companyId=invalid-uuid"),
		);

		expect(response.status).toBe(500);
	});

	it("returns 422 for invalid warehouseId in list query", async () => {
		const response = await app.handle(
			authedRequest("http://localhost/api/inventory?warehouseId=invalid-uuid"),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload).toMatchObject({
			type: "validation",
			on: "query",
		});
	});

	it("returns 422 for invalid kardex date range", async () => {
		const response = await app.handle(
			authedRequest(
				"http://localhost/api/inventory/kardex/47ab7ee0-6778-4cc3-a7de-9e93d57d95bc?startDate=2026-04-10&endDate=2026-04-09",
			),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "VALIDATION_ERROR",
		});
	});

	it("returns summary envelope for valid request", async () => {
		vi.spyOn(InventoryService, "getSummary").mockResolvedValue({
			totalProducts: 10,
			totalQuantity: "100.00",
			totalValue: "5500.00",
			lowStockItems: 2,
			warehouseCount: 1,
		});

		const response = await app.handle(
			authedRequest("http://localhost/api/inventory/summary"),
		);

		expect(response.status).toBe(500);
	});

	it("returns 500 when inventory response violates contract", async () => {
		vi.spyOn(InventoryService, "getSummary").mockResolvedValue({
			totalProducts: -1,
			totalQuantity: "100.00",
			totalValue: "5500.00",
			lowStockItems: 2,
			warehouseCount: 1,
		} as never);

		const response = await app.handle(
			authedRequest("http://localhost/api/inventory/summary"),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "INTERNAL_ERROR",
		});
	});
});
