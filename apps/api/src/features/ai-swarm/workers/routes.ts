/**
 * AI Workers Queue Routes
 * API endpoints para el sistema de cola de workers AI
 * @module apps/api/src/features/ai-swarm/workers/routes
 */

import { type CreateTaskDTO,
	queueManager, } from "@drenyra/agents";
import { Elysia, t } from "elysia";
import { authorizeAiSurface } from "../../security/ai-surface-access";
import type { SecurityOperation } from "../../security/rbac-policy";

/**
 * Shared response helpers
 */
function ok<T>(data: T, message?: string) {
	return {
		success: true,
		data,
		message,
	};
}

function fail(error: string, code: string) {
	return {
		success: false,
		error,
		code,
	};
}

interface AiWorkerAccessContext {
	readonly companyId: string;
	readonly userId: string;
}

type AiWorkerSet = { status?: number | string };

async function authorizeAiWorkerRequest(input: {
	headers: Record<string, unknown>;
	operation: SecurityOperation;
	resource: string;
	set: AiWorkerSet;
	requestedCompanyId?: string;
}): Promise<AiWorkerAccessContext | ReturnType<typeof fail>> {
	const access = await authorizeAiSurface({
		headers: input.headers,
		operation: input.operation,
		resource: input.resource,
		requestedCompanyId: input.requestedCompanyId,
	});

	if (!access.ok) {
		input.set.status = access.status;
		return fail(access.error, access.code);
	}

	return {
		companyId: access.context.companyId,
		userId: access.context.legacyUserId ?? access.context.userId,
	};
}

function isAuthFailure(
	value: AiWorkerAccessContext | ReturnType<typeof fail>,
): value is ReturnType<typeof fail> {
	return "success" in value && value.success === false;
}

function failTenantMismatch() {
	return fail(
		"Requested company scope does not match authenticated AI surface tenant",
		"TENANT_SCOPE_VIOLATION",
	);
}

/**
 * POST /api/ai-workers/enqueue
 * Encola una nueva tarea en la cola de workers AI
 */
const enqueueRoute = new Elysia().post(
	"/enqueue",
	async ({ body, headers, set }) => {
		try {
			const access = await authorizeAiWorkerRequest({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:approval:resolve",
				resource: "/api/ai-workers/enqueue",
				requestedCompanyId: body.companyId,
				set,
			});
			if (isAuthFailure(access)) return access;

			if (body.companyId !== access.companyId) {
				set.status = 403;
				return failTenantMismatch();
			}

			const taskDTO: CreateTaskDTO = {
				companyId: access.companyId,
				userId: body.userId || access.userId,
				type: body.type,
				payload: body.payload as Record<string, unknown>,
				priority: body.priority ?? "medium",
				maxRetries: body.maxRetries ?? 3,
			};

			const taskId = await queueManager.enqueue(taskDTO);

			set.status = 201;
			return ok(
				{
					taskId,
					status: "pending",
				},
				"Task queued successfully",
			);
		} catch (error) {
			set.status = 400;
			return fail(
				error instanceof Error ? error.message : "Failed to enqueue task",
				"FAILED_TO_ENQUEUE_TASK_ERROR",
			);
		}
	},
	{
		body: t.Object({
			companyId: t.String({ format: "uuid" }),
			userId: t.String({ format: "uuid" }),
			type: t.String({ minLength: 1, maxLength: 100 }),
			payload: t.Object({}, { additionalProperties: true }),
			priority: t.Optional(
				t.Union([
					t.Literal("low"),
					t.Literal("medium"),
					t.Literal("high"),
					t.Literal("critical"),
				]),
			),
			maxRetries: t.Optional(t.Number({ minimum: 0, maximum: 10 })),
		}),
	},
);

/**
 * GET /api/ai-workers/status/:taskId
 * Consulta el estado de una tarea específica
 */
const statusRoute = new Elysia().get(
	"/status/:taskId",
	async ({ params: { taskId }, headers, set }) => {
		try {
			const access = await authorizeAiWorkerRequest({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:state:read",
				resource: "/api/ai-workers/status/:taskId",
				set,
			});
			if (isAuthFailure(access)) return access;

			const status = await queueManager.getStatusForCompany(
				taskId,
				access.companyId,
			);

			if (!status) {
				set.status = 404;
				return fail(`Task ${taskId} not found`, "TASK_NOT_FOUND_ERROR");
			}

			return ok(status);
		} catch (error) {
			set.status = 500;
			return fail(
				error instanceof Error ? error.message : "Failed to get task status",
				"FAILED_TO_GET_STATUS_ERROR",
			);
		}
	},
	{
		params: t.Object({
			taskId: t.String({ minLength: 1 }),
		}),
	},
);

/**
 * GET /api/ai-workers/list
 * Lista tareas con filtros (status, companyId, type)
 */
const listRoute = new Elysia().get(
	"/list",
	async ({ query, headers, set }) => {
		try {
			const access = await authorizeAiWorkerRequest({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:state:read",
				resource: "/api/ai-workers/list",
				requestedCompanyId: query.companyId,
				set,
			});
			if (isAuthFailure(access)) return access;

			if (query.companyId && query.companyId !== access.companyId) {
				set.status = 403;
				return failTenantMismatch();
			}

			const limit = Math.min(Number(query.limit) || 50, 100);
			const offset = Number(query.offset) || 0;
			const status = query.status as string | undefined;
			const type = query.type as string | undefined;

			const tasks = await queueManager.getPendingForCompany(
				access.companyId,
				limit,
				offset,
			);

			let filteredTasks = tasks;
			if (status) {
				filteredTasks = filteredTasks.filter((task) => task.status === status);
			}
			if (type) {
				filteredTasks = filteredTasks.filter((task) => task.type === type);
			}

			const stats = await queueManager.getStatsForCompany(access.companyId);

			return ok({
				tasks: filteredTasks,
				pagination: {
					limit,
					offset,
					total: stats.total,
				},
				stats,
			});
		} catch (error) {
			set.status = 500;
			return fail(
				error instanceof Error ? error.message : "Failed to list tasks",
				"FAILED_TO_LIST_TASKS_ERROR",
			);
		}
	},
	{
		query: t.Object({
			limit: t.Optional(t.String()),
			offset: t.Optional(t.String()),
			status: t.Optional(t.String()),
			companyId: t.Optional(t.String()),
			type: t.Optional(t.String()),
		}),
	},
);

/**
 * GET /api/ai-workers/metrics
 * Retorna estadísticas de la cola de workers
 */
const metricsRoute = new Elysia().get("/metrics", async ({ headers, set }) => {
	try {
		const access = await authorizeAiWorkerRequest({
			headers: headers as Record<string, unknown>,
			operation: "cognitive:state:read",
			resource: "/api/ai-workers/metrics",
			set,
		});
		if (isAuthFailure(access)) return access;

		const stats = await queueManager.getStatsForCompany(access.companyId);

		return ok({
			...stats,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		set.status = 500;
		return fail(
			error instanceof Error ? error.message : "Failed to get metrics",
			"FAILED_TO_GET_METRICS_ERROR",
		);
	}
});

/**
 * DELETE /api/ai-workers/:taskId
 * Cancela una tarea pendiente
 */
const cancelRoute = new Elysia().delete(
	"/:taskId",
	async ({ params: { taskId }, headers, set }) => {
		try {
			const access = await authorizeAiWorkerRequest({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:approval:resolve",
				resource: "/api/ai-workers/:taskId",
				set,
			});
			if (isAuthFailure(access)) return access;

			await queueManager.cancelTaskForCompany(taskId, access.companyId);

			return ok({ taskId, cancelled: true }, "Task cancelled successfully");
		} catch (error) {
			set.status = 400;
			return fail(
				error instanceof Error ? error.message : "Failed to cancel task",
				"FAILED_TO_CANCEL_TASK_ERROR",
			);
		}
	},
	{
		params: t.Object({
			taskId: t.String({ minLength: 1 }),
		}),
	},
);

/**
 * AI Workers Routes - Combined route module.
 *
 * @param request - Incoming HTTP request whose headers identify the AI surface caller.
 * @returns Elysia plugin exposing company-scoped AI worker queue controls.
 * @throws Returns fail-closed API errors when tenant scope cannot be authorized.
 * @example
 * ```ts
 * const app = new Elysia().use(aiWorkersRoutes);
 * ```
 */
/**
 *
 * @example
 * ```ts
 * console.log(aiWorkersRoutes);
 * ```
 */
export const aiWorkersRoutes = new Elysia({ prefix: "/api/ai-workers" })
	.use(enqueueRoute)
	.use(statusRoute)
	.use(listRoute)
	.use(metricsRoute)
	.use(cancelRoute);
