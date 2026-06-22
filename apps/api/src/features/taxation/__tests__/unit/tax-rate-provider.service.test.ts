import { describe, expect, it, vi } from "vitest";
import { TaxRateProviderService } from "../../application/services/tax-rate-provider.service";

describe("TaxRateProviderService", () => {
	it("uses VAT_TOTAL when available and returns component breakdown", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn(async (code: string) => {
				if (code === "VAT_TOTAL") return { rate: 0.18 };
				if (code === "IGV_COMPONENT") return { rate: 0.155 };
				if (code === "IPM_COMPONENT") return { rate: 0.025 };
				return null;
			}),
		};

		const service = new TaxRateProviderService(repository as never);
		const result = await service.getVatBreakdown(
			new Date("2026-10-15T12:00:00.000Z"),
		);

		expect(result).toEqual({
			totalRate: 0.18,
			igvComponentRate: 0.155,
			ipmComponentRate: 0.025,
			source: "VAT_TOTAL",
			effectiveDate: "2026-10-15",
		});
	});

	it("sums IGV/IPM components when VAT_TOTAL is missing", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn(async (code: string) => {
				if (code === "VAT_TOTAL") return null;
				if (code === "IGV_COMPONENT") return { rate: 0.15 };
				if (code === "IPM_COMPONENT") return { rate: 0.03 };
				return null;
			}),
		};

		const service = new TaxRateProviderService(repository as never);
		const result = await service.getVatBreakdown(
			new Date("2027-05-01T12:00:00.000Z"),
		);

		expect(result.totalRate).toBe(0.18);
		expect(result.igvComponentRate).toBe(0.15);
		expect(result.ipmComponentRate).toBe(0.03);
		expect(result.source).toBe("COMPONENT_SUM");
	});

	it("falls back to default rates when no tax rule exists", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn().mockResolvedValue(null),
		};

		const service = new TaxRateProviderService(repository as never);
		const rate = await service.getVatRate(new Date("2026-02-20T12:00:00.000Z"));

		expect(rate).toBe(0.18);
	});

	it("returns SPOT detraccion config from rule version", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn(async (code: string) => {
				if (code === "DETRACCION_SPOT_SERVICES") {
					return { rate: 0.12, thresholdCents: 70000 };
				}
				return null;
			}),
		};

		const service = new TaxRateProviderService(repository as never);
		const config = await service.getSpotDetractionConfig(
			new Date("2026-02-20T12:00:00.000Z"),
		);

		expect(config).toEqual({
			rate: 0.12,
			thresholdCents: 70000,
			source: "RULE",
			profile: "SERVICES",
			ruleCode: "DETRACCION_SPOT_SERVICES",
			effectiveDate: "2026-02-20",
		});
	});

	it("uses profile-specific rule when TRANSPORT is requested", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn(async (code: string) => {
				if (code === "DETRACCION_SPOT_TRANSPORT") {
					return { rate: 0.04, thresholdCents: 40000 };
				}
				return null;
			}),
		};

		const service = new TaxRateProviderService(repository as never);
		const config = await service.getSpotDetractionConfig(
			new Date("2026-02-20T12:00:00.000Z"),
			"TRANSPORT",
		);

		expect(config.rate).toBe(0.04);
		expect(config.thresholdCents).toBe(40000);
		expect(config.profile).toBe("TRANSPORT");
		expect(config.ruleCode).toBe("DETRACCION_SPOT_TRANSPORT");
	});

	it("falls back to DETRACCION_SPOT when profile rule is missing", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn(async (code: string) => {
				if (code === "DETRACCION_SPOT_TRANSPORT") return null;
				if (code === "DETRACCION_SPOT") {
					return { rate: 0.12, thresholdCents: 70000 };
				}
				return null;
			}),
		};

		const service = new TaxRateProviderService(repository as never);
		const config = await service.getSpotDetractionConfig(
			new Date("2026-02-20T12:00:00.000Z"),
			"TRANSPORT",
		);

		expect(config.rate).toBe(0.12);
		expect(config.profile).toBe("TRANSPORT");
		expect(config.ruleCode).toBe("DETRACCION_SPOT");
		expect(config.source).toBe("RULE");
	});

	it("falls back to default SPOT detraccion config when rule is missing", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn().mockResolvedValue(null),
		};

		const service = new TaxRateProviderService(repository as never);
		const config = await service.getSpotDetractionConfig(
			new Date("2026-02-20T12:00:00.000Z"),
		);

		expect(config.rate).toBe(0.12);
		expect(config.thresholdCents).toBe(70000);
		expect(config.source).toBe("FALLBACK");
		expect(config.profile).toBe("SERVICES");
		expect(config.ruleCode).toBe("DEFAULT");
	});

	it("emits effectiveDate in Peru fiscal timezone on UTC boundary instants", async () => {
		const repository = {
			getEffectiveRuleVersion: vi.fn().mockResolvedValue(null),
		};

		const service = new TaxRateProviderService(repository as never);
		const breakdown = await service.getVatBreakdown(
			new Date("2026-01-01T04:30:00.000Z"),
		);

		expect(breakdown.effectiveDate).toBe("2025-12-31");
	});
});
