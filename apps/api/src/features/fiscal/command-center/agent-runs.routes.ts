import { Elysia } from "elysia";
import { fail, ok } from "../../shared/api-response";
import { resolveFiscalCmdContext } from "./context";
import { type RunAgentInput, RunAgentSchema } from "./schemas";
import { agentRunService } from "./services/agent-runs.service";

type AgentRunService = typeof agentRunService;

/**
 * createAgentRunsRoutes operation.
 *
 * @param service - Input for service.
 * @returns Result of createAgentRunsRoutes.
 * @example
 * ```ts
 * const result = createAgentRunsRoutes({} as AgentRunService);
 * console.log(result);
 * ```
 */
export function createAgentRunsRoutes(
	service: AgentRunService = agentRunService,
) {
	return new Elysia({ prefix: "/agent-runs" })
		.get(
			"/",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.list(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const run = await service.getById(params.id, resolved.context);
				if (!run) {
					set.status = 404;
					return fail("Agent run not found", "NOT_FOUND");
				}
				return ok(run);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.post(
			"/",
			async ({ headers, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(
					await service.create(body as RunAgentInput, resolved.context),
				);
			},
			{ body: RunAgentSchema, detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id/logs",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const logs = await service.getLogs(params.id, resolved.context);
				if (!logs) {
					set.status = 404;
					return fail("Agent run not found", "NOT_FOUND");
				}
				return ok(logs);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id/outputs",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const outputs = await service.getOutputs(params.id, resolved.context);
				if (!outputs) {
					set.status = 404;
					return fail("Agent run not found", "NOT_FOUND");
				}
				return ok(outputs);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		);
}

/**
 * agentRunsRoutes const.
 *
 * @example
 * ```ts
 * console.log(agentRunsRoutes);
 * ```
 */
export const agentRunsRoutes = createAgentRunsRoutes();
