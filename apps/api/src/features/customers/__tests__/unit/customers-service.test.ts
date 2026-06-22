import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomersService } from "../customers.service";

// Mock the database module
vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([]),
	},
}));

describe("CustomersService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("list", () => {
		it("should return customers list for a company", async () => {
			const mockCustomers = [
				{
					id: "cus_001",
					companyId: "cmp_123",
					ruc: "20123456789",
					razonSocial: "Cliente SAC",
					nombreComercial: "Cliente",
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockCustomers),
						}),
					}),
				}),
			} as any);

			const result = await CustomersService.list("cmp_123");

			expect(result).toEqual(mockCustomers);
		});

		it("should return empty array when no customers exist", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			} as any);

			const result = await CustomersService.list("cmp_123");

			expect(result).toEqual([]);
		});
	});

	describe("getById", () => {
		it("should return a customer by id", async () => {
			const mockCustomer = {
				id: "cus_001",
				ruc: "20123456789",
				razonSocial: "Cliente SAC",
			};

			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCustomer]),
						}),
					}),
				}),
			} as any);

			const result = await CustomersService.getById("cus_001");

			expect(result).toEqual(mockCustomer);
		});
	});

	describe("create", () => {
		it("should create a new customer with valid RUC", async () => {
			const newCustomer = {
				companyId: "cmp_123",
				ruc: "20123456789", // Valid RUC
				razonSocial: "Nuevo Cliente SAC",
			};

			const mockCreated = { id: "cus_002", ...newCustomer };

			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.insert).mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockCreated]),
				}),
			} as any);

			const result = await CustomersService.create(newCustomer as any);

			expect(result).toEqual([mockCreated]);
		});

		it("should reject customer with invalid RUC", async () => {
			const invalidCustomer = {
				companyId: "cmp_123",
				ruc: "12345678901", // Invalid RUC
				razonSocial: "Cliente Inválido",
			};

			await expect(
				CustomersService.create(invalidCustomer as any),
			).rejects.toThrow("Invalid RUC");
		});
	});

	describe("update", () => {
		it("should update an existing customer", async () => {
			const updatedCustomer = {
				id: "cus_001",
				razonSocial: "Cliente Actualizado",
			};

			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.update).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedCustomer]),
					}),
				}),
			} as any);

			const result = await CustomersService.update("cus_001", {
				razonSocial: "Cliente Actualizado",
			} as any);

			expect(result).toEqual([updatedCustomer]);
		});
	});

	describe("delete", () => {
		it("should delete a customer", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			vi.mocked(db.delete).mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{ id: "cus_001" }]),
				}),
			} as any);

			const result = await CustomersService.delete("cus_001");

			expect(result).toEqual([{ id: "cus_001" }]);
		});
	});
});
