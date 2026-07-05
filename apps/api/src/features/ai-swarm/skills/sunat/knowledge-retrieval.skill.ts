/**
 * Skill: sunat.knowledge-retrieval
 *
 * RAG skill — retrieves relevant SUNAT norms from the PostgreSQL FTS knowledge base.
 * This is the ZeroClaw "memory" concept applied to legal knowledge:
 * instead of conversation memory, it's regulatory memory.
 *
 * Used by the SUNAT agent to ground its reasoning in actual legal text
 * instead of relying on LLM training data (which may be outdated).
 */

import { sunatKnowledgeService } from "@drenyra/ai/services/sunat-knowledge";
import { z } from "zod";
import type { Skill } from "../skill.types";

const InputSchema = z.object({
	query: z.string().min(3, "Query mínimo 3 caracteres"),
	categories: z
		.array(
			z.enum([
				"igv",
				"detraccion",
				"sire",
				"ruc",
				"bancarizacion",
				"pcge",
				"uit",
				"retencion",
				"percepcion",
			]),
		)
		.optional(),
	corpusId: z.enum(["sunat-sire-manuals", "sunat-cpe-specs"]).optional(),
	limit: z.number().int().min(1).max(10).optional().default(5),
});

/**
 * KnowledgeRetrievalInput type.
 *
 * @example
 * ```ts
 * const value: KnowledgeRetrievalInput = {} as KnowledgeRetrievalInput;
 * console.log(value);
 * ```
 */
export type KnowledgeRetrievalInput = z.infer<typeof InputSchema>;

/**
 * knowledgeRetrievalSkill const.
 *
 * @example
 * ```ts
 * console.log(knowledgeRetrievalSkill);
 * ```
 */
export const knowledgeRetrievalSkill: Skill<KnowledgeRetrievalInput> = {
	id: "sunat.knowledge-retrieval",
	name: "SUNAT Knowledge Retrieval",
	description:
		"Recupera normas SUNAT relevantes de la base de conocimiento jurídico usando búsqueda full-text. Usa esto antes de validar una factura o SIRE para obtener las reglas exactas aplicables al caso. Retorna chunks de normas ordenados por relevancia.",
	category: "sunat",
	inputSchema: InputSchema,
	outputSchema: z.unknown(),
	handler: async (input) => {
		if (input.corpusId) {
			return sunatKnowledgeService.buildDocumentaryContext({
				query: input.query,
				categories: input.categories,
				limit: input.limit,
				corpusId: input.corpusId,
			});
		}

		return sunatKnowledgeService.buildContext({
			query: input.query,
			categories: input.categories,
			limit: input.limit,
		});
	},
	metadata: {
		version: "1.0.0",
		legalRef: "RS-000005-2026/SUNAT",
		costEstimateUsd: 0,
		usesAI: false,
		deterministic: false, // FTS ranking has some variability
	},
};
