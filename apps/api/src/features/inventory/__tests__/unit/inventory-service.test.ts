import { db } from "@drenyra/persistence/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryService } from "../../inventory.service";

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: vi.fn(),
		from: vi.fn(),
		leftJoin: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
	},
}));

describe("InventoryService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it("lists inventory rows", async () => {
		const rows = [
			{
				id: "inv-1",
				productId: "prod-1",
				warehouseId: "wh-1",
				quantity: "12.0000",
			},
		];

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(rows),
						}),
					}),
				}),
			}),
		});

		const result = await InventoryService.list("cmp-1");

		expect(result).toEqual(rows);
	});

	it("returns first row for getByProduct", async () => {
		const row = {
			id: "inv-1",
			productId: "prod-1",
			warehouseId: "wh-1",
			quantity: "5.0000",
			unitCost: "10.0000",
			totalValue: "50.0000",
			product: null,
		};

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([row]),
					}),
				}),
			}),
		});

		const result = await InventoryService.getByProduct("prod-1");

		expect(result).toEqual(row);
	});
});
