/**
 * ExchangeRate Service Tests
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	ExchangeRate,
	InvalidExchangeRateError,
} from "@drenyra/domain/accounting/exchange-rate";
import type { ExchangeRateRepository } from "@drenyra/domain/repositories/exchange-rate.repository";
import { ExchangeRateService, type SetRateDTO } from "../exchange-rate.service";

describe("ExchangeRateService", () => {
	let service: ExchangeRateService;
	let mockRepo: { [K in keyof ExchangeRateRepository]: Mock };

	const mockCompanyId = "660e8400-e29b-41d4-a716-446655440001";

	function createValidDTO(overrides: Partial<SetRateDTO> = {}): SetRateDTO {
		return {
			date: new Date("2025-06-15"),
			currencyFrom: "USD",
			currencyTo: "PEN",
			buyRate: 3.7250,
			sellRate: 3.7350,
			sunatReferenceRate: 3.7300,
			...overrides,
		};
	}

	beforeEach(() => {
		mockRepo = {
			save: vi.fn().mockResolvedValue(undefined),
			findById: vi.fn().mockResolvedValue(null),
			findByDateAndCurrency: vi.fn().mockResolvedValue(null),
			findByDateRange: vi.fn().mockResolvedValue([]),
			findLatestBefore: vi.fn().mockResolvedValue(null),
			delete: vi.fn().mockResolvedValue(undefined),
		} as unknown as { [K in keyof ExchangeRateRepository]: Mock };

		service = new ExchangeRateService(mockRepo);
	});

	describe("setRate", () => {
		it("should set a new exchange rate successfully", async () => {
			const dto = createValidDTO();

			const rate = await service.setRate(mockCompanyId, dto);

			expect(rate).toBeDefined();
			expect(rate.currencyFrom).toBe("USD");
			expect(rate.currencyTo).toBe("PEN");
			expect(rate.buy).toBe(3.7250);
			expect(rate.sell).toBe(3.7350);
			expect(rate.sunatReference).toBe(3.7300);
			expect(mockRepo.save).toHaveBeenCalledTimes(1);
		});

		it("should set a rate without SUNAT reference", async () => {
			const dto = createValidDTO({ sunatReferenceRate: undefined });

			const rate = await service.setRate(mockCompanyId, dto);

			expect(rate.sunatReference).toBeNull();
		});

		it("should throw for invalid currency codes", async () => {
			const dto = createValidDTO({ currencyFrom: "INVALID" });

			await expect(
				service.setRate(mockCompanyId, dto),
			).rejects.toThrow(InvalidExchangeRateError);
		});

		it("should throw for same currency from/to", async () => {
			const dto = createValidDTO({ currencyTo: "USD" });

			await expect(
				service.setRate(mockCompanyId, dto),
			).rejects.toThrow(InvalidExchangeRateError);
		});

		it("should throw for negative buy rate", async () => {
			const dto = createValidDTO({ buyRate: -1 });

			await expect(
				service.setRate(mockCompanyId, dto),
			).rejects.toThrow(InvalidExchangeRateError);
		});

		it("should throw for empty company ID", async () => {
			const dto = createValidDTO();

			await expect(
				service.setRate("", dto),
			).rejects.toThrow(InvalidExchangeRateError);
		});

		it("should normalize currency codes to uppercase", async () => {
			const dto = createValidDTO({
				currencyFrom: "usd",
				currencyTo: "pen",
			});

			const rate = await service.setRate(mockCompanyId, dto);

			expect(rate.currencyFrom).toBe("USD");
			expect(rate.currencyTo).toBe("PEN");
		});
	});

	describe("getRate", () => {
		it("should return exact date match when available", async () => {
			const expectedRate = ExchangeRate.create(
				new Date("2025-06-15"),
				"USD",
				"PEN",
				3.7250,
				3.7350,
			);
			mockRepo.findByDateAndCurrency.mockResolvedValue(expectedRate);

			const result = await service.getRate(
				mockCompanyId,
				new Date("2025-06-15"),
				"USD",
				"PEN",
			);

			expect(result).toBeDefined();
			expect(result!.buy).toBe(3.7250);
			expect(mockRepo.findLatestBefore).not.toHaveBeenCalled();
		});

		it("should fall back to latest before when no exact match", async () => {
			const fallbackRate = ExchangeRate.create(
				new Date("2025-06-14"),
				"USD",
				"PEN",
				3.7200,
				3.7300,
			);
			mockRepo.findByDateAndCurrency.mockResolvedValue(null);
			mockRepo.findLatestBefore.mockResolvedValue(fallbackRate);

			const result = await service.getRate(
				mockCompanyId,
				new Date("2025-06-15"),
				"USD",
				"PEN",
			);

			expect(result).toBeDefined();
			expect(result!.buy).toBe(3.7200);
			expect(mockRepo.findLatestBefore).toHaveBeenCalled();
		});

		it("should return null when no rate found at all", async () => {
			mockRepo.findByDateAndCurrency.mockResolvedValue(null);
			mockRepo.findLatestBefore.mockResolvedValue(null);

			const result = await service.getRate(
				mockCompanyId,
				new Date("2025-06-15"),
				"USD",
				"PEN",
			);

			expect(result).toBeNull();
		});

		it("should throw for empty company ID", async () => {
			await expect(
				service.getRate("", new Date(), "USD", "PEN"),
			).rejects.toThrow(InvalidExchangeRateError);
		});
	});

	describe("getRateHistory", () => {
		it("should return rates for a date range", async () => {
			const rates = [
				ExchangeRate.create(new Date("2025-06-15"), "USD", "PEN", 3.7250, 3.7350),
				ExchangeRate.create(new Date("2025-06-16"), "USD", "PEN", 3.7300, 3.7400),
			];
			mockRepo.findByDateRange.mockResolvedValue(rates);

			const result = await service.getRateHistory(
				mockCompanyId,
				new Date("2025-06-01"),
				new Date("2025-06-30"),
				"USD",
				"PEN",
			);

			expect(result).toHaveLength(2);
			expect(mockRepo.findByDateRange).toHaveBeenCalled();
		});

		it("should return empty array when no rates in range", async () => {
			mockRepo.findByDateRange.mockResolvedValue([]);

			const result = await service.getRateHistory(
				mockCompanyId,
				new Date("2025-01-01"),
				new Date("2025-01-31"),
				"USD",
				"PEN",
			);

			expect(result).toHaveLength(0);
		});
	});
});
