import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productsModule } from "../../index";
import { ProductsService } from "../../products.service";

describe("products routes", () => {
	const app = new Elysia().use(productsModule);

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns 422 for invalid companyId in list query", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/products?companyId=not-a-uuid"),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "VALIDATION_ERROR",
		});
	});

	it("creates product with valid payload", async () => {
		vi.spyOn(ProductsService, "create").mockResolvedValue({
			id: "8f71e183-a989-4264-ae27-df0974f6210f",
			companyId: "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc",
			sku: "SKU-001",
			name: "Laptop",
			description: null,
			category: null,
			unitPrice: "1200.00",
			costPrice: null,
			taxType: "GRAVADO",
			unit: "UND",
			stockQuantity: "0",
			minStock: null,
			maxStock: null,
			imageUrl: null,
			isActive: true,
			createdAt: new Date("2026-04-08T00:00:00.000Z"),
			updatedAt: new Date("2026-04-08T00:00:00.000Z"),
		});

		const response = await app.handle(
			new Request("http://localhost/api/products", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc",
					sku: "SKU-001",
					name: "Laptop",
					unitPrice: "1200.00",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				id: "8f71e183-a989-4264-ae27-df0974f6210f",
			},
		});
	});

	it("returns 422 for empty patch payload", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/products/47ab7ee0-6778-4cc3-a7de-9e93d57d95bc",
				{
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({}),
				},
			),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "VALIDATION_ERROR",
		});
	});

	it("returns 500 when product response violates contract", async () => {
		vi.spyOn(ProductsService, "create").mockResolvedValue({
			id: "8f71e183-a989-4264-ae27-df0974f6210f",
			companyId: "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc",
			sku: "SKU-001",
			name: "Laptop",
			description: null,
			category: null,
			unitPrice: "invalid-money",
			costPrice: null,
			taxType: "GRAVADO",
			unit: "UND",
			stockQuantity: "0",
			minStock: null,
			maxStock: null,
			imageUrl: null,
			isActive: true,
			createdAt: new Date("2026-04-08T00:00:00.000Z"),
			updatedAt: new Date("2026-04-08T00:00:00.000Z"),
		} as never);

		const response = await app.handle(
			new Request("http://localhost/api/products", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc",
					sku: "SKU-001",
					name: "Laptop",
					unitPrice: "1200.00",
				}),
			}),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "PRODUCT_CONTRACT_ERROR",
		});
	});
});
