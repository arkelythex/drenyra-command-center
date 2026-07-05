import { createDrenyraHarness } from "@drenyra/harness";
import { Elysia, t } from "elysia";
import { resolveFiscalCmdContext } from "../fiscal/command-center/context";
import { fail, ok } from "../shared/api-response";
import { HarnessExecuteBodySchema } from "./schemas";

const harness = createDrenyraHarness({
	onApprovalRequired: async () => true,
});

/**
 * DRENYRA Drenyra sovereign agent harness — HTTP entry for nested delegation tree.
 */
export const drenyraHarnessRoutes = new Elysia({ prefix: "/harness" })
	.get(
		"/agents",
		() => {
			return ok({
				agents: harness.getRegisteredAgents(),
				maxDepth: 3,
			});
		},
		{ detail: { tags: ["DRENYRA Harness"] } },
	)
	.post(
		"/execute",
		async ({ headers, body, set }) => {
			const resolved = resolveFiscalCmdContext(headers);
			if (!resolved.ok) {
				set.status = 400;
				return resolved.error;
			}
			const ctx = resolved.context;
			const input = body as {
				task: string;
				rootAgentId?: string;
				autoSpawn?: boolean;
				metadata?: Record<string, unknown>;
			};

			const response = await harness.execute({
				task: input.task,
				rootAgentId: input.rootAgentId,
				autoSpawn: input.autoSpawn ?? true,
				context: {
					sessionId: crypto.randomUUID(),
					organizationId: ctx.organizationId,
					companyId: ctx.companyId,
					companyRuc: ctx.companyRuc,
					period: ctx.period,
					traceId: crypto.randomUUID(),
					userId: ctx.userId,
					metadata: input.metadata,
				},
			});

			if (response.status === "pending_approval") {
				return ok({
					...response,
					message: "Human approval required before material fiscal actions",
				});
			}

			return ok(response);
		},
		{
			body: HarnessExecuteBodySchema,
			detail: { tags: ["DRENYRA Harness"] },
		},
	)
	.post(
		"/spawn",
		async ({ headers, body, set }) => {
			const resolved = resolveFiscalCmdContext(headers);
			if (!resolved.ok) {
				set.status = 400;
				return resolved.error;
			}
			const ctx = resolved.context;
			const input = body as {
				agentId: string;
				task: string;
				depth?: number;
				parentRunId?: string;
			};

			if (!input.agentId || !input.task) {
				set.status = 400;
				return fail("agentId and task are required", "VALIDATION_ERROR");
			}

			const node = await harness.spawn({
				agentId: input.agentId,
				task: input.task,
				depth: input.depth ?? 0,
				parentRunId: input.parentRunId,
				context: {
					sessionId: crypto.randomUUID(),
					organizationId: ctx.organizationId,
					companyId: ctx.companyId,
					companyRuc: ctx.companyRuc,
					period: ctx.period,
					traceId: crypto.randomUUID(),
					userId: ctx.userId,
				},
			});

			return ok(node);
		},
		{
			body: t.Object({
				agentId: t.String({ minLength: 1 }),
				task: t.String({ minLength: 1 }),
				depth: t.Optional(t.Number()),
				parentRunId: t.Optional(t.String()),
			}),
			detail: { tags: ["DRENYRA Harness"] },
		},
	);
