/**
 * Agents API Route
 *
 * GET /agents — list all registered agents
 * POST /agents/:id/execute — execute a specific agent
 *
 * @module ai-swarm/api/agents
 */

import { type Agent, getAllRegisteredAgents } from "@drenyra/pi";
import { Elysia, t } from "elysia";
import { createLogger } from "../../../lib/logger";
import { fail, ok } from "../../shared/api-response";
import {
	agentExecutionDuration,
	agentExecutionErrors,
	agentExecutionsTotal,
} from "./agents.metrics";

const logger = createLogger({ module: "ai-swarm/agents" });

function agentToDTO(a: Agent) {
	return {
		id: a.id,
		name: a.name,
		description: a.description,
		capabilities: a.capabilities,
		priority: a.priority,
		drenyraSubagent: a.drenyraSubagent ?? null,
	};
}

export const agentsRoute = new Elysia()
	.get(
		"/agents",
		() => {
			const agents = getAllRegisteredAgents();
			const list = agents.map(agentToDTO);
			logger.info({ count: list.length }, "agents_list");
			return ok(list);
		},
		{
			detail: {
				tags: ["AI Swarm"],
				summary: "List all registered agents",
				description:
					"Returns metadata for every agent registered in the agent-swarm factory",
			},
		},
	)
	.post(
		"/agents/:id/execute",
		async ({ params: { id }, body }) => {
			const startTime = Date.now();
			const agent = getAllRegisteredAgents().find((a) => a.id === id);
			if (!agent) {
				agentExecutionsTotal.inc({ agent_id: id, status: "not_found" });
				return fail(`Agent not found: ${id}`, "AGENT_NOT_FOUND");
			}

			try {
				const result = await agent.execute(
					{
						id: crypto.randomUUID(),
						type: "agent-execute",
						payload: body.payload || {},
					},
					body.config ?? undefined,
				);

				const duration = (Date.now() - startTime) / 1000;
				agentExecutionDuration.observe({ agent_id: id }, duration);
				agentExecutionsTotal.inc({
					agent_id: id,
					status: result.success ? "success" : "error",
				});

				logger.info(
					{
						agentId: id,
						durationMs: Date.now() - startTime,
						resultStatus: result.success,
					},
					"agent_executed",
				);
				return ok(result);
			} catch (error) {
				const duration = (Date.now() - startTime) / 1000;
				const message =
					error instanceof Error ? error.message : "Unknown error";
				const errorType = error instanceof Error ? error.name : "unknown";

				agentExecutionDuration.observe({ agent_id: id }, duration);
				agentExecutionsTotal.inc({ agent_id: id, status: "error" });
				agentExecutionErrors.inc({ agent_id: id, error_type: errorType });

				logger.error(
					{ agentId: id, durationMs: Date.now() - startTime, error: message },
					"agent_execute_failed",
				);
				return fail(message, "AGENT_EXECUTION_ERROR");
			}
		},
		{
			body: t.Object({
				payload: t.Optional(t.Record(t.String(), t.Unknown())),
				config: t.Optional(t.Unknown()),
			}),
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				tags: ["AI Swarm"],
				summary: "Execute an agent by ID",
				description:
					"Runs an agent's execute function with the provided payload and optional config",
			},
		},
	);
