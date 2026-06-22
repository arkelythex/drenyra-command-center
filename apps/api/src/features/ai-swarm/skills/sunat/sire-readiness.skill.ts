/**
 * Skill: sunat.sire-readiness
 *
 * Wraps SireReadinessSubagentsService as a formally registered skill.
 * Deterministic — zero LLM cost, fully auditable.
 */

import { z } from "zod";
import { SireReadinessSubagentsService } from "../../workflows/sire-readiness-subagents.service";
import type { Skill } from "../skill.types";

const InputSchema = z.object({
	companyId: z.string().min(1),
	period: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM requerido"),
	salesTotalPen: z.number().nonnegative(),
	declaredIgvPen: z.number().nonnegative(),
	pleSalesRecords: z.number().int().nonnegative(),
	plePurchaseRecords: z.number().int().nonnegative(),
	rvieRecords: z.number().int().nonnegative(),
	rceRecords: z.number().int().nonnegative(),
	detractionableBasePen: z.number().nonnegative().optional().default(0),
	declaredDetractionPen: z.number().nonnegative().optional().default(0),
});

/**
 * SireReadinessInput type.
 *
 * @example
 * ```ts
 * const value: SireReadinessInput = {} as SireReadinessInput;
 * console.log(value);
 * ```
 */
export type SireReadinessInput = z.infer<typeof InputSchema>;

const service = new SireReadinessSubagentsService();

/**
 * sireReadinessSkill const.
 *
 * @example
 * ```ts
 * console.log(sireReadinessSkill);
 * ```
 */
export const sireReadinessSkill: Skill<SireReadinessInput> = {
	id: "sunat.sire-readiness",
	name: "SIRE Readiness Check",
	description:
		"Verifica si la empresa está lista para presentar el SIRE (RVIE/RCE) validando consistencia IGV, registros PLE vs SIRE y detracciones SPOT. Retorna checks detallados con anomalías.",
	category: "sunat",
	inputSchema: InputSchema,
	outputSchema: z.unknown(),
	handler: async (input) => service.run(input),
	metadata: {
		version: "1.0.0",
		legalRef: "RS-000005-2026/SUNAT",
		costEstimateUsd: 0,
		usesAI: false,
		deterministic: true,
	},
};
