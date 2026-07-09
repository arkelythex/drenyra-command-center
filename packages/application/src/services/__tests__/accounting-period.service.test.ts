/**
 * AccountingPeriod Service Tests
 */

import {
	AccountingPeriod,
	InvalidAccountingPeriodError,
} from "@drenyra/domain/accounting/accounting-period";
import type { AccountingPeriodRepository } from "@drenyra/domain/repositories/accounting-period.repository";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { AccountingPeriodService } from "../accounting-period.service";

describe("AccountingPeriodService", () => {
	let service: AccountingPeriodService;
	let mockRepo: { [K in keyof AccountingPeriodRepository]: Mock };

	const mockCompanyId = "550e8400-e29b-41d4-a716-446655440000";

	beforeEach(() => {
		mockRepo = {
			save: vi.fn().mockResolvedValue(undefined),
			findById: vi.fn().mockResolvedValue(null),
			findByCompanyAndPeriod: vi.fn().mockResolvedValue(null),
			findAllByCompany: vi.fn().mockResolvedValue([]),
			findByYear: vi.fn().mockResolvedValue([]),
			getCurrentPeriod: vi.fn().mockResolvedValue(null),
			delete: vi.fn().mockResolvedValue(undefined),
			count: vi.fn().mockResolvedValue(0),
		} as unknown as { [K in keyof AccountingPeriodRepository]: Mock };

		service = new AccountingPeriodService(mockRepo);
	});

	describe("openPeriod", () => {
		it("should open a new period successfully", async () => {
			const period = await service.openPeriod(mockCompanyId, 2025, 1);

			expect(period).toBeDefined();
			expect(period.year).toBe(2025);
			expect(period.month).toBe(1);
			expect(period.status).toBe("abierto");
			expect(period.periodKey).toBe("2025-01");
			expect(mockRepo.save).toHaveBeenCalledTimes(1);
		});

		it("should throw when period already exists", async () => {
			const existingPeriod = AccountingPeriod.create(2025, 1, "abierto");
			mockRepo.findByCompanyAndPeriod.mockResolvedValue(existingPeriod);

			await expect(service.openPeriod(mockCompanyId, 2025, 1)).rejects.toThrow(
				InvalidAccountingPeriodError,
			);

			expect(mockRepo.save).not.toHaveBeenCalled();
		});

		it("should throw for invalid year", async () => {
			await expect(service.openPeriod(mockCompanyId, 2019, 1)).rejects.toThrow(
				InvalidAccountingPeriodError,
			);
		});

		it("should throw for invalid month", async () => {
			await expect(service.openPeriod(mockCompanyId, 2025, 13)).rejects.toThrow(
				InvalidAccountingPeriodError,
			);
		});

		it("should throw for empty company ID", async () => {
			await expect(service.openPeriod("", 2025, 1)).rejects.toThrow(
				InvalidAccountingPeriodError,
			);
		});
	});

	describe("closePeriod", () => {
		it("should close a period partially", async () => {
			const openPeriod = AccountingPeriod.create(2025, 1, "abierto");
			mockRepo.findById.mockResolvedValue(openPeriod);

			const closed = await service.closePeriod("test-id", "parcial");

			expect(closed.status).toBe("cerrado_parcial");
			expect(mockRepo.save).toHaveBeenCalledTimes(1);
		});

		it("should close a period finally", async () => {
			const openPeriod = AccountingPeriod.create(2025, 1, "abierto");
			mockRepo.findById.mockResolvedValue(openPeriod);

			const closed = await service.closePeriod("test-id", "final");

			expect(closed.status).toBe("cerrado_final");
			expect(mockRepo.save).toHaveBeenCalledTimes(1);
		});

		it("should throw when period not found", async () => {
			mockRepo.findById.mockResolvedValue(null);

			await expect(
				service.closePeriod("non-existent", "final"),
			).rejects.toThrow("not found");
		});

		it("should throw for empty period ID", async () => {
			await expect(service.closePeriod("", "final")).rejects.toThrow(
				"Period ID is required",
			);
		});

		it("should throw when transitioning from invalid state", async () => {
			const auditedPeriod = AccountingPeriod.create(2025, 1, "auditado");
			mockRepo.findById.mockResolvedValue(auditedPeriod);

			await expect(
				service.closePeriod("audited-id", "final"),
			).rejects.toThrow();
		});
	});

	describe("getCurrentPeriod", () => {
		it("should return current period when one exists", async () => {
			const openPeriod = AccountingPeriod.create(2025, 1, "abierto");
			mockRepo.getCurrentPeriod.mockResolvedValue(openPeriod);

			const result = await service.getCurrentPeriod(mockCompanyId);

			expect(result).toBeDefined();
			expect(result?.status).toBe("abierto");
		});

		it("should return null when no open period exists", async () => {
			mockRepo.getCurrentPeriod.mockResolvedValue(null);

			const result = await service.getCurrentPeriod(mockCompanyId);

			expect(result).toBeNull();
		});

		it("should throw for empty company ID", async () => {
			await expect(service.getCurrentPeriod("")).rejects.toThrow(
				"Company ID is required",
			);
		});
	});

	describe("listPeriods", () => {
		it("should list all periods for a company", async () => {
			const periods = [
				AccountingPeriod.create(2025, 1, "abierto"),
				AccountingPeriod.create(2025, 2, "cerrado_parcial"),
			];
			mockRepo.findAllByCompany.mockResolvedValue(periods);

			const result = await service.listPeriods(mockCompanyId);

			expect(result).toHaveLength(2);
			expect(mockRepo.findAllByCompany).toHaveBeenCalledWith(mockCompanyId);
		});

		it("should list periods filtered by year", async () => {
			const periods = [
				AccountingPeriod.create(2025, 1, "abierto"),
				AccountingPeriod.create(2025, 2, "cerrado_parcial"),
			];
			mockRepo.findByYear.mockResolvedValue(periods);

			const result = await service.listPeriods(mockCompanyId, 2025);

			expect(result).toHaveLength(2);
			expect(mockRepo.findByYear).toHaveBeenCalledWith(mockCompanyId, 2025);
		});

		it("should return empty list when no periods exist", async () => {
			mockRepo.findAllByCompany.mockResolvedValue([]);

			const result = await service.listPeriods(mockCompanyId);

			expect(result).toHaveLength(0);
		});

		it("should throw for empty company ID", async () => {
			await expect(service.listPeriods("")).rejects.toThrow(
				"Company ID is required",
			);
		});
	});
});
