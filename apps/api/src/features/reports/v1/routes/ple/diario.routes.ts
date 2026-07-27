/**
 * PLE Libro Diario Route
 *
 * POST /api/v1/reports/ple/diario
 * Generates the Journal Book (Libro Diario) in SUNAT Formato 5.1.
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { PleGeneratorService } from "../../../application/services/ple-generator.service";
import { formatDiario } from "../../../application/generators/ple-diario.formatter";
import { PleGenerationRequestSchema } from "../../schemas/ple.schemas";

const pleGenerator = new PleGeneratorService();

export const pleDiarioRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/api/v1/reports/ple/diario",
		async ({ body, companyContext, set }: {
			body: { period: string; ruc: string };
			companyContext?: { companyId: string };
			set: { status?: number | string };
		}) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context required", "COMPANY_CONTEXT_REQUIRED");
			}

			try {
				// TODO: Replace with actual LedgerQuery call
				// For Phase 1, accept sample/empty records
				const records: Array<Parameters<typeof formatDiario>[0][0]> = [];

				const content = formatDiario(
					records as any,
					body.period,
					body.ruc,
				);

				const result = await pleGenerator.generatePleBook(
					companyContext.companyId,
					"LE-DIARIO",
					body.period,
					body.ruc,
					content,
				);

				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(
					error instanceof Error ? error.message : "PLE generation failed",
					"PLE_GENERATION_ERROR",
				);
			}
		},
		{
			body: PleGenerationRequestSchema,
			detail: {
				tags: ["PLE"],
				summary: "Generate PLE Libro Diario",
			},
		},
	);
