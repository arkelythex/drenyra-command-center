import { db } from "@drenyra/persistence/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsService } from "../../products.service";

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		query: {
			products: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
	},
}));

describe("ProductsService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it("lists active products by company", async () => {
		const rows = [{ id: "prod-1", companyId: "cmp-1", sku: "SKU-1" }];
		(db.query.products.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
			rows,
		);

		const result = await ProductsService.list("cmp-1");

		expect(result).toEqual(rows);
		expect(db.query.products.findMany).toHaveBeenCalledTimes(1);
	});

	it("creates one product", async () => {
		const created = {
			id: "prod-2",
			companyId: "cmp-1",
			sku: "SKU-2",
			name: "Producto",
			unitPrice: "100.00",
		};

		(db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([created]),
			}),
		});

		const result = await ProductsService.create({
			companyId: "cmp-1",
			sku: "SKU-2",
			name: "Producto",
			unitPrice: "100.00",
		});

		expect(result).toEqual(created);
	});

	it("updates one product", async () => {
		const updated = { id: "prod-1", name: "Nuevo Nombre" };
		(db.update as ReturnType<typeof vi.fn>).mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([updated]),
				}),
			}),
		});

		const result = await ProductsService.update("prod-1", {
			name: "Nuevo Nombre",
		});

		expect(result).toEqual(updated);
	});

	it("soft deletes one product", async () => {
		const deleted = { id: "prod-1", isActive: false };
		(db.update as ReturnType<typeof vi.fn>).mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deleted]),
				}),
			}),
		});

		const result = await ProductsService.delete("prod-1");

		expect(result).toEqual(deleted);
	});
});
