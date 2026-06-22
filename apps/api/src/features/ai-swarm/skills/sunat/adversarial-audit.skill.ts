/**
 * Skill: audit.adversarial-sire
 *
 * Wraps the full adversarial audit pipeline (Creator → Destructor → Arbiter).
 * Deterministic pipeline — the most expensive skill in the SUNAT category.
 */

import { z } from "zod";
import { SireAdversarialAuditService } from "../../workflows/sire-adversarial-audit.service";
import type { Skill } from "../skill.types";

const InputSchema = z.object({
	companyId: z.string().min(1),
	period: z.string().regex(/^\d{4}-\d{2}$/),
	ruc: z.string().length(11, "RUC debe tener 11 dígitos"),
	salesTotalPen: z.number().nonnegative(),
	declaredIgvPen: z.number().nonnegative(),
	pleSalesRecords: z.number().int().nonnegative(),
	plePurchaseRecords: z.number().int().nonnegative(),
	rvieRecords: z.number().int().nonnegative(),
	rceRecords: z.number().int().nonnegative(),
	detractionableBasePen: z.number().nonnegative().optional().default(0),
	declaredDetractionPen: z.number().nonnegative().optional().default(0),
	falsePositiveRate: z.number().min(0).max(1).optional().default(0.05),
});

/**
 * AdversarialAuditInput type.
 *
 * @example
 * ```ts
 * const value: AdversarialAuditInput = {} as AdversarialAuditInput;
 * console.log(value);
 * ```
 */
export type AdversarialAuditInput = z.infer<typeof InputSchema>;

const service = new SireAdversarialAuditService();

/**
 * adversarialAuditSkill const.
 *
 * @example
 * ```ts
 * console.log(adversarialAuditSkill);
 * ```
 */
export const adversarialAuditSkill: Skill<AdversarialAuditInput> = {
	id: "audit.adversarial-sire",
	name: "Adversarial SIRE Audit",
	description:
		"Ejecuta el ciclo Creator→Destructor→Arbiter sobre los datos SIRE. El Creator propone envío o conciliación, el Destructor ataca la propuesta buscando vulnerabilidades, el Arbiter da el veredicto final (approved/manual_review/rejected). Es el nivel máximo de verificación antes de presentar a SUNAT.",
	category: "audit",
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
