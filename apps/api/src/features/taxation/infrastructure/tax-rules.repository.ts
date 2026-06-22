import { db } from "@arkelythex/persistence/client";
import { and, desc, eq, gt, lte, or, sql } from "@arkelythex/persistence/query";
import { taxRules, taxRuleVersions } from "@arkelythex/persistence/schema";
import { toPeruTaxDateKey } from "../domain/tax-date";

/**
 * TaxRuleCode type.
 *
 * @example
 * ```ts
 * const value: TaxRuleCode = {} as TaxRuleCode;
 * console.log(value);
 * ```
 */
export type TaxRuleCode =
	| "VAT_TOTAL"
	| "IGV_COMPONENT"
	| "IPM_COMPONENT"
	| "DETRACCION_SPOT"
	| "DETRACCION_SPOT_SERVICES"
	| "DETRACCION_SPOT_TRANSPORT"
	| "DETRACCION_SPOT_CONSTRUCTION";

/**
 * EffectiveTaxRuleVersion interface.
 *
 * @example
 * ```ts
 * const value: EffectiveTaxRuleVersion = {} as EffectiveTaxRuleVersion;
 * console.log(value);
 * ```
 */
export interface EffectiveTaxRuleVersion {
	code: TaxRuleCode;
	rate: number | null;
	thresholdCents: number | null;
	effectiveFrom: string;
	effectiveTo: string | null;
	metadata: Record<string, unknown>;
}

function parseNumeric(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	const parsed = Number.parseFloat(String(value));
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * TaxRulesRepository class.
 *
 * @example
 * ```ts
 * const value = new TaxRulesRepository();
 * console.log(value);
 * ```
 */
export class TaxRulesRepository {
	async getEffectiveRuleVersion(
		code: TaxRuleCode,
		atDate: Date = new Date(),
	): Promise<EffectiveTaxRuleVersion | null> {
		const targetDate = toPeruTaxDateKey(atDate);

		const rows = await db
			.select({
				code: taxRules.code,
				rate: taxRuleVersions.rate,
				thresholdCents: taxRuleVersions.thresholdCents,
				effectiveFrom: taxRuleVersions.effectiveFrom,
				effectiveTo: taxRuleVersions.effectiveTo,
				metadata: taxRuleVersions.metadata,
			})
			.from(taxRuleVersions)
			.innerJoin(taxRules, eq(taxRuleVersions.ruleId, taxRules.id))
			.where(
				and(
					eq(taxRules.code, code),
					lte(taxRuleVersions.effectiveFrom, targetDate),
					or(
						sql`${taxRuleVersions.effectiveTo} IS NULL`,
						gt(taxRuleVersions.effectiveTo, targetDate),
					),
				),
			)
			.orderBy(desc(taxRuleVersions.effectiveFrom))
			.limit(1);

		const row = rows[0];
		if (!row) return null;

		return {
			code,
			rate: parseNumeric(row.rate),
			thresholdCents: row.thresholdCents ?? null,
			effectiveFrom: row.effectiveFrom,
			effectiveTo: row.effectiveTo,
			metadata:
				row.metadata && typeof row.metadata === "object"
					? (row.metadata as Record<string, unknown>)
					: {},
		};
	}
}

/**
 * taxRulesRepository const.
 *
 * @example
 * ```ts
 * console.log(taxRulesRepository);
 * ```
 */
export const taxRulesRepository = new TaxRulesRepository();
