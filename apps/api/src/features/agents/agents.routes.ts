/**
 * Agents Feature — Elysia Routes
 *
 * REST API for agent session monitoring and lifecycle management.
 * Follows the same patterns as Threads routes.
 *
 * @module features/agents/agents.routes
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { AppError } from "../../lib/errors";
import { agentsService } from "./agents.service";
import { ActionBody, ListSessionsQuery, SessionParams } from "./agents.schemas";

// ---------------------------------------------------------------------------
// Helper to handle errors (matches threads.routes.ts pattern)
// ---------------------------------------------------------------------------

function handleServiceError(
	error: unknown,
	set: { status: number; [key: string]: unknown },
) {
	if (error instanceof AppError) {
		set.status = error.statusCode;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const agentsRoutes = new Elysia({
	prefix: "/api/agents",
	name: "agents",
})
	.use(companyScopeGuard())

	// 1. GET /sessions — List agent sessions
	.get(
		"/sessions",
		async ({ query, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const limit = query.limit ? parseInt(query.limit, 10) : undefined;
				const offset = query.offset ? parseInt(query.offset, 10) : undefined;

				const result = agentsService.listSessions(companyId, {
					client: query.client,
					period: query.period,
					status: query.status,
					risk: query.risk,
					agentType: query.agentType,
					limit,
					offset,
				});

				return ok(result);
			} catch (error) {
				return handleServiceError(
					error,
					{} as { status: number; [key: string]: unknown },
				);
			}
		},
		{
			query: ListSessionsQuery,
			detail: {
				tags: ["Agents"],
				summary: "List agent sessions",
				description:
					"List active agent sessions with optional filters for client, period, status, risk, and agent type",
			},
		},
	)

	// 2. GET /sessions/:id — Get session detail
	.get(
		"/sessions/:id",
		async ({ params, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = agentsService.getSession(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: SessionParams,
			detail: {
				tags: ["Agents"],
				summary: "Get agent session",
				description: "Get full detail for a specific agent session",
			},
		},
	)

	// 3. GET /sessions/:id/timeline — Get session timeline
	.get(
		"/sessions/:id/timeline",
		async ({ params, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = agentsService.getTimeline(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: SessionParams,
			detail: {
				tags: ["Agents"],
				summary: "Get agent session timeline",
				description: "Get the step timeline for an agent session",
			},
		},
	)

	// 4. POST /sessions/:id/pause — Pause session
	.post(
		"/sessions/:id/pause",
		async ({ params, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = agentsService.pauseSession(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: SessionParams,
			body: ActionBody,
			detail: {
				tags: ["Agents"],
				summary: "Pause agent session",
				description: "Pause a running agent session",
			},
		},
	)

	// 5. POST /sessions/:id/resume — Resume session
	.post(
		"/sessions/:id/resume",
		async ({ params, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = agentsService.resumeSession(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: SessionParams,
			body: ActionBody,
			detail: {
				tags: ["Agents"],
				summary: "Resume agent session",
				description: "Resume a paused agent session",
			},
		},
	)

	// 6. POST /sessions/:id/cancel — Cancel session
	.post(
		"/sessions/:id/cancel",
		async ({ params, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = agentsService.cancelSession(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: SessionParams,
			body: ActionBody,
			detail: {
				tags: ["Agents"],
				summary: "Cancel agent session",
				description: "Cancel a running agent session",
			},
		},
	);
