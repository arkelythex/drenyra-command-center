import {
	normalizeSpotDetractionProfile,
	type SpotDetractionProfile,
} from "../../domain/spot-detraction-profile";
import { toPeruTaxDateKey } from "../../domain/tax-date";
import {
	type TaxRuleCode,
	type TaxRulesRepository,
	taxRulesRepository,
} from "../../infrastructure/tax-rules.repository";

/**
 * VatRateBreakdown interface.
 *
 * @example
 * ```ts
 * const value: VatRateBreakdown = {} as VatRateBreakdown;
 * console.log(value);
 * ```
 */
export interface VatRateBreakdown {
	totalRate: number;
	igvComponentRate: number;
	ipmComponentRate: number;
	source: "VAT_TOTAL" | "COMPONENT_SUM" | "FALLBACK";
	effectiveDate: string;
}

/**
 * SpotDetractionConfig interface.
 *
 * @example
 * ```ts
 * const value: SpotDetractionConfig = {} as SpotDetractionConfig;
 * console.log(value);
 * ```
 */
export interface SpotDetractionConfig {
	rate: number;
	thresholdCents: number;
	source: "RULE" | "FALLBACK";
	profile: SpotDetractionProfile;
	ruleCode: TaxRuleCode | "DEFAULT";
	effectiveDate: string;
}

type TaxRulesRepoContract = Pick<TaxRulesRepository, "getEffectiveRuleVersion">;

const DEFAULT_TOTAL_RATE = 0.18;
const DEFAULT_IGV_COMPONENT_RATE = 0.16;
const DEFAULT_IPM_COMPONENT_RATE = 0.02;
const DEFAULT_SPOT_DETRACTION_RATE = 0.12;
const DEFAULT_SPOT_DETRACTION_THRESHOLD_CENTS = 70000;
const SPOT_RULE_BY_PROFILE: Record<SpotDetractionProfile, TaxRuleCode> = {
	SERVICES: "DETRACCION_SPOT_SERVICES",
	TRANSPORT: "DETRACCION_SPOT_TRANSPORT",
	CONSTRUCTION: "DETRACCION_SPOT_CONSTRUCTION",
	GENERIC: "DETRACCION_SPOT",
};

function clampRate(rate: number): number {
	if (!Number.isFinite(rate) || rate < 0) return 0;
	return Number(rate.toFixed(6));
}

function sumRates(...values: number[]): number {
	const total = values.reduce((acc, value) => acc + value, 0);
	return clampRate(total);
}

/**
 * TaxRateProviderService class.
 *
 * @example
 * ```ts
 * const value = new TaxRateProviderService();
 * console.log(value);
 * ```
 */
export class TaxRateProviderService {
	constructor(
		private readonly repository: TaxRulesRepoContract = taxRulesRepository,
	) {}

	async getVatBreakdown(atDate: Date = new Date()): Promise<VatRateBreakdown> {
		const [vatTotal, igvComponent, ipmComponent] = await Promise.all([
			this.getRate("VAT_TOTAL", atDate),
			this.getRate("IGV_COMPONENT", atDate),
			this.getRate("IPM_COMPONENT", atDate),
		]);

		if (vatTotal !== null) {
			const igvRate = igvComponent ?? DEFAULT_IGV_COMPONENT_RATE;
			const ipmRate =
				ipmComponent ?? clampRate(Math.max(vatTotal - igvRate, 0));

			return {
				totalRate: clampRate(vatTotal),
				igvComponentRate: clampRate(igvRate),
				ipmComponentRate: clampRate(ipmRate),
				source: "VAT_TOTAL",
				effectiveDate: toPeruTaxDateKey(atDate),
			};
		}

		if (igvComponent !== null || ipmComponent !== null) {
			const igvRate = igvComponent ?? DEFAULT_IGV_COMPONENT_RATE;
			const ipmRate = ipmComponent ?? DEFAULT_IPM_COMPONENT_RATE;
			return {
				totalRate: sumRates(igvRate, ipmRate),
				igvComponentRate: clampRate(igvRate),
				ipmComponentRate: clampRate(ipmRate),
				source: "COMPONENT_SUM",
				effectiveDate: toPeruTaxDateKey(atDate),
			};
		}

		return {
			totalRate: DEFAULT_TOTAL_RATE,
			igvComponentRate: DEFAULT_IGV_COMPONENT_RATE,
			ipmComponentRate: DEFAULT_IPM_COMPONENT_RATE,
			source: "FALLBACK",
			effectiveDate: toPeruTaxDateKey(atDate),
		};
	}

	async getVatRate(atDate: Date = new Date()): Promise<number> {
		const breakdown = await this.getVatBreakdown(atDate);
		return breakdown.totalRate;
	}

	async getSpotDetractionConfig(
		atDate: Date = new Date(),
		profileInput: SpotDetractionProfile = "SERVICES",
	): Promise<SpotDetractionConfig> {
		const profile = normalizeSpotDetractionProfile(profileInput);
		const ruleCandidates: TaxRuleCode[] =
			profile === "GENERIC"
				? ["DETRACCION_SPOT"]
				: [SPOT_RULE_BY_PROFILE[profile], "DETRACCION_SPOT"];

		for (const ruleCode of ruleCandidates) {
			const version = await this.repository.getEffectiveRuleVersion(
				ruleCode,
				atDate,
			);
			if (!version || version.rate === null) continue;

			return {
				rate: clampRate(version.rate),
				thresholdCents:
					typeof version.thresholdCents === "number"
						? Math.max(version.thresholdCents, 0)
						: DEFAULT_SPOT_DETRACTION_THRESHOLD_CENTS,
				source: "RULE",
				profile,
				ruleCode,
				effectiveDate: toPeruTaxDateKey(atDate),
			};
		}

		return {
			rate: DEFAULT_SPOT_DETRACTION_RATE,
			thresholdCents: DEFAULT_SPOT_DETRACTION_THRESHOLD_CENTS,
			source: "FALLBACK",
			profile,
			ruleCode: "DEFAULT",
			effectiveDate: toPeruTaxDateKey(atDate),
		};
	}

	async getSpotDetractionRate(
		atDate: Date = new Date(),
		profile: SpotDetractionProfile = "SERVICES",
	): Promise<number> {
		const config = await this.getSpotDetractionConfig(atDate, profile);
		return config.rate;
	}

	private async getRate(
		code: TaxRuleCode,
		atDate: Date,
	): Promise<number | null> {
		const version = await this.repository.getEffectiveRuleVersion(code, atDate);
		return version?.rate ?? null;
	}
}

/**
 * taxRateProviderService const.
 *
 * @example
 * ```ts
 * console.log(taxRateProviderService);
 * ```
 */
export const taxRateProviderService = new TaxRateProviderService();
