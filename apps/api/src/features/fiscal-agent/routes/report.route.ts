/**
 * Fiscal Agent Report Routes — GET reports, trigger manual runs.
 */

import { FiscalNightlyRunUseCase } from "@drenyra/application/use-cases/fiscal-agent/fiscal-nightly-run.use-case";
import { triggerManualRun } from "@drenyra/infrastructure/queues/fiscal-agent.queue";
import { Elysia } from "elysia";
import { z } from "zod";
import { ok } from "../../shared/api-response";

const useCase = new FiscalNightlyRunUseCase();

export const fiscalAgentReportRoute = new Elysia()
	.post(
		"/fiscal-agent/run",
		async ({ body }) => {
			const report = await useCase.execute(body);
			return ok(report);
		},
		{
			body: z.object({
				organizationId: z.number(),
				companyId: z.string(),
				period: z.string(),
				countryCode: z.enum(["PE", "MX", "CL", "CO"]).default("PE"),
				userId: z.string().optional(),
			}),
			detail: {
				tags: ["Fiscal Agent"],
				summary: "Trigger manual fiscal agent nightly run",
			},
		},
	)
	.post(
		"/fiscal-agent/schedule",
		async ({ body }) => {
			await triggerManualRun(body);
			return ok({
				message: "Nightly run scheduled",
				orgId: body.organizationId,
			});
		},
		{
			body: z.object({
				organizationId: z.number(),
				companyId: z.string(),
				period: z.string(),
				countryCode: z.enum(["PE", "MX", "CL", "CO"]).default("PE"),
			}),
			detail: {
				tags: ["Fiscal Agent"],
				summary: "Schedule nightly fiscal agent run",
			},
		},
	);
