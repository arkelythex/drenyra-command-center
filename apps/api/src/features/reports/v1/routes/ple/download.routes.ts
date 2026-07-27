/**
 * PLE Download Route
 *
 * GET /api/v1/reports/ple/download/:generationId
 * Downloads a validated PLE file. Returns 422 if not validated.
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { PleGeneratorService } from "../../../application/services/ple-generator.service";
import { z } from "zod";

const pleGenerator = new PleGeneratorService();
const IdParamSchema = z.object({ generationId: z.string().uuid() });

export const pleDownloadRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/api/v1/reports/ple/download/:generationId",
		async ({ params, companyContext, set }: {
			params: { generationId: string };
			companyContext?: { companyId: string };
			set: { status?: number | string };
		}) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context required", "COMPANY_CONTEXT_REQUIRED");
			}

			const generation = await pleGenerator.getGeneration(params.generationId);

			if (!generation) {
				set.status = 404;
				return fail("PLE generation not found", "PLE_NOT_FOUND");
			}

			if (generation.status !== "validated") {
				set.status = 422;
				return fail("PLE file has not passed validation", "PLE_VALIDATION_FAILED", {
					details: { status: generation.status, errors: generation.validationErrors },
				});
			}

			return new Response(generation.fileContent, {
				status: 200,
				headers: {
					"Content-Type": "text/plain; charset=windows-1252",
					"Content-Disposition": `attachment; filename="PLE_${generation.bookType}_${generation.period}.txt"`,
					"X-CDR-Hash": generation.cdrHash ?? "",
				},
			});
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Download PLE file",
			},
		},
	);
