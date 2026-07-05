/**
 * CreateClientUseCase Tests
 */

import type { ClientRepository } from "@drenyra/domain/repositories/client.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateClientUseCase } from "../create-client.use-case";

// Mock repository
const createMockRepository = (): ClientRepository => ({
	save: vi.fn(),
	findById: vi.fn(),
	findByDocumentNumber: vi.fn(),
	findByOrganization: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	search: vi.fn(),
});

describe("CreateClientUseCase", () => {
	let useCase: CreateClientUseCase;
	let mockRepo: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepo = createMockRepository();
		useCase = new CreateClientUseCase(mockRepo);
	});

	describe("RUC validation", () => {
		it("should reject RUC with less than 11 digits", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "2012345678", // 10 digits
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de RUC inválido");
		});

		it("should reject RUC with more than 11 digits", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "201234567890", // 12 digits
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de RUC inválido");
		});

		it("should reject RUC with letters", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "2012345678A",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de RUC inválido");
		});

		it("should accept valid 11-digit RUC", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((input) =>
				Promise.resolve({
					id: 1,
					...input,
				}),
			);

			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "20123456789",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("DNI validation", () => {
		it("should reject DNI with less than 8 digits", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "Juan Pérez",
				documentType: "DNI",
				documentNumber: "1234567", // 7 digits
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de DNI inválido");
		});

		it("should reject DNI with more than 8 digits", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "Juan Pérez",
				documentType: "DNI",
				documentNumber: "123456789", // 9 digits
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de DNI inválido");
		});

		it("should accept valid 8-digit DNI", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((input) =>
				Promise.resolve({
					id: 1,
					...input,
				}),
			);

			const result = await useCase.execute({
				organizationId: 1,
				name: "Juan Pérez",
				documentType: "DNI",
				documentNumber: "12345678",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("CE validation", () => {
		it("should reject CE with less than 9 characters", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "John Doe",
				documentType: "CE",
				documentNumber: "ABC12345",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de CE inválido");
		});

		it("should reject CE with lowercase letters", async () => {
			const result = await useCase.execute({
				organizationId: 1,
				name: "John Doe",
				documentType: "CE",
				documentNumber: "abc123456",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Formato de CE inválido");
		});

		it("should accept valid 9-character uppercase CE", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((input) =>
				Promise.resolve({
					id: 1,
					...input,
				}),
			);

			const result = await useCase.execute({
				organizationId: 1,
				name: "John Doe",
				documentType: "CE",
				documentNumber: "ABC123456",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("Duplicate detection", () => {
		it("should reject duplicate document number", async () => {
			const existingClient = {
				id: 1,
				organizationId: 1,
				name: "Existing Company",
				documentType: "RUC",
				documentNumber: "20123456789",
			};
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(existingClient);

			const result = await useCase.execute({
				organizationId: 1,
				name: "New Company SAC",
				documentType: "RUC",
				documentNumber: "20123456789",
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Ya existe un cliente con RUC");
			expect(mockRepo.findByDocumentNumber).toHaveBeenCalledWith(
				1,
				"20123456789",
			);
		});
	});

	describe("Successful creation", () => {
		it("should create client with required fields", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((input) =>
				Promise.resolve({
					id: 1,
					...input,
				}),
			);

			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "20123456789",
			});

			expect(result.success).toBe(true);
			expect(result.client).toBeDefined();
			expect(result.client?.name).toBe("Test Company SAC");
			expect(mockRepo.save).toHaveBeenCalled();
		});

		it("should create client with all optional fields", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((input) =>
				Promise.resolve({
					id: 1,
					...input,
				}),
			);

			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company SAC",
				documentType: "RUC",
				documentNumber: "20123456789",
				email: "contact@test.com",
				phone: "999888777",
				address: "Av. Javier Prado 123",
				creditLimit: "10000",
				creditDays: 30,
			});

			expect(result.success).toBe(true);
			expect(result.client?.email).toBe("contact@test.com");
			expect(result.client?.creditDays).toBe(30);
		});
	});

	describe("Error handling", () => {
		it("should handle repository errors gracefully", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockRejectedValue(new Error("Database error"));

			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company",
				documentType: "RUC",
				documentNumber: "20123456789",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Database error");
		});

		it("should handle unknown errors", async () => {
			mockRepo.findByDocumentNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockRejectedValue("Unknown error");

			const result = await useCase.execute({
				organizationId: 1,
				name: "Test Company",
				documentType: "RUC",
				documentNumber: "20123456789",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Error al crear cliente");
		});
	});
});
