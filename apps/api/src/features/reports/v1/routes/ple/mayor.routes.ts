import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { PleGeneratorService } from "../../../application/services/ple-generator.service";
import { formatMayor } from "../../../application/generators/ple-mayor.formatter";
import { PleGenerationRequestSchema } from "../../schemas/ple.schemas";

const pleGenerator = new PleGeneratorService();

export const pleMayorRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/api/v1/reports/ple/mayor",
		async ({ body, companyContext, set }: {
			body: { period: string; ruc: string };
			companyContext?: { companyId: string };
			set: { status?: number | string };
		}) => {
			if (!companyContext) { set.status = 401; return fail("Company context required", "COMPANY_CONTEXT_REQUIRED"); }
			try {
				const result = await pleGenerator.generatePleBook(
					companyContext.companyId, "LE-MAYOR", body.period, body.ruc,
					formatMayor([], body.period, body.ruc),
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(error instanceof Error ? error.message : "PLE generation failed", "PLE_GENERATION_ERROR");
			}
		},
		{ body: PleGenerationRequestSchema, detail: { tags: ["PLE"], summary: "Generate PLE Libro Mayor" } },
	);
