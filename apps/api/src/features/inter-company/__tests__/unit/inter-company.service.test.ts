import { describe, it, expect, vi, beforeEach } from "vitest";
import { InterCompanyService } from "../services/inter-company.service";

// Mock the database module
vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnValue({
			orderBy: vi.fn().mockResolvedValue([]),
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([]),
			}),
		}),
	},
}));

describe("InterCompanyService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTransactions", () => {
		it("should return inter-company transactions", async () => {
			const result = await InterCompanyService.getTransactions(
				"cmp_001",
				"cmp_002",
			);

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("createTransaction", () => {
		it("should create an inter-company transaction", async () => {
			const transaction = {
				fromCompanyId: "cmp_001",
				toCompanyId: "cmp_002",
				amount: 10000,
				currency: "PEN",
				type: "TRANSFER",
				description: "Test transfer",
			};

			const result = await InterCompanyService.createTransaction(
				transaction as any,
			);

			expect(result).toBeDefined();
		});
	});

	describe("calculateBalance", () => {
		it("should calculate balance between two companies", async () => {
			const result = await InterCompanyService.calculateBalance(
				"cmp_001",
				"cmp_002",
			);

			expect(result).toBeDefined();
			expect(typeof result.balance).toBe("number");
		});
	});
});
