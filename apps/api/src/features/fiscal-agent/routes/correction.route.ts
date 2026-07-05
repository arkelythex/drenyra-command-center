/**
 * Fiscal Agent Correction Routes — POST user corrections.
 */

import { CorrectionUseCase } from "@drenyra/application/use-cases/fiscal-agent/fiscal-nightly-run.use-case";
import { Elysia } from "elysia";
import { z } from "zod";
import { fail, ok } from "../../shared/api-response";

const correctionUseCase = new CorrectionUseCase();

export const fiscalAgentCorrectionRoute = new Elysia().post(
	"/fiscal-agent/corrections",
	async ({ body }) => {
		const result = await correctionUseCase.execute(body.corrections);
		return ok(result);
	},
	{
		body: z.object({
			corrections: z.array(
				z.object({
					transactionId: z.string(),
					originalCategory: z.string(),
					correctedCategory: z.string(),
					userId: z.string(),
					reason: z.string().optional(),
				}),
			),
		}),
		detail: {
			tags: ["Fiscal Agent"],
			summary: "Submit corrections to improve future categorization",
		},
	},
);
