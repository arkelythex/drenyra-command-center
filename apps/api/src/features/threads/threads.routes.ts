import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	ThreadServiceError,
	threadsService,
} from "./threads.service";
import { quickActionsService } from "./quick-actions.service";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const ListThreadsQuery = t.Object({
	companyId: t.Optional(t.String({ minLength: 1 })),
	status: t.Optional(t.String()),
	period: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
	priority: t.Optional(t.String()),
	search: t.Optional(t.String()),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
});

const QuickActionsQuery = t.Object({
	companyId: t.Optional(t.String({ minLength: 1 })),
	period: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
});

const CreateThreadBody = t.Object({
	companyId: t.String({ minLength: 1 }),
	title: t.String({ minLength: 1, maxLength: 200 }),
	description: t.Optional(t.String({ maxLength: 2000 })),
	environment: t.Optional(
		t.Union([
			t.Literal("local"),
			t.Literal("sandbox"),
			t.Literal("cloud"),
		]),
	),
	period: t.Optional(
		t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
	),
	priority: t.Optional(
		t.Union([
			t.Literal("LOW"),
			t.Literal("MEDIUM"),
			t.Literal("HIGH"),
			t.Literal("URGENT"),
		]),
	),
	tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
	tasks: t.Array(
		t.Object({
			title: t.String({ minLength: 1, maxLength: 200 }),
			description: t.Optional(t.String({ maxLength: 2000 })),
			order: t.Optional(t.Number({ minimum: 1 })),
		}),
		{ minItems: 1 },
	),
});

const ThreadParams = t.Object({
	id: t.String({ minLength: 1 }),
});

const UpdateThreadBody = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
	description: t.Optional(t.String({ maxLength: 2000 })),
	status: t.Optional(t.String()),
	priority: t.Optional(
		t.Union([
			t.Literal("LOW"),
			t.Literal("MEDIUM"),
			t.Literal("HIGH"),
			t.Literal("URGENT"),
		]),
	),
	environment: t.Optional(
		t.Union([
			t.Literal("local"),
			t.Literal("sandbox"),
			t.Literal("cloud"),
		]),
	),
	tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
	period: t.Optional(
		t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
	),
});

const AssignAgentBody = t.Object({
	agentId: t.String({ minLength: 1 }),
	agentName: t.String({ minLength: 1 }),
	role: t.Union([
		t.Literal("PRIMARY"),
		t.Literal("SUPPORT"),
		t.Literal("REVIEWER"),
		t.Literal("OBSERVER"),
	]),
});

const AgentParams = t.Object({
	id: t.String({ minLength: 1 }),
	agentId: t.String({ minLength: 1 }),
});

const LinkEvidenceBody = t.Object({
	evidenceId: t.String({ minLength: 1 }),
	note: t.Optional(t.String()),
});

const EvidenceParams = t.Object({
	id: t.String({ minLength: 1 }),
	evidenceId: t.String({ minLength: 1 }),
});

const CloseThreadBody = t.Object({
	closeNote: t.Optional(t.String()),
});

const CreateTaskBody = t.Object({
	title: t.String({ minLength: 1, maxLength: 200 }),
	description: t.Optional(t.String({ maxLength: 2000 })),
	order: t.Optional(t.Number({ minimum: 1 })),
});

const TaskParams = t.Object({
	id: t.String({ minLength: 1 }),
	taskId: t.String({ minLength: 1 }),
});

const UpdateTaskBody = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
	description: t.Optional(t.String({ maxLength: 2000 })),
	status: t.Optional(t.String()),
	agentId: t.Optional(t.String()),
	resultSummary: t.Optional(t.String()),
	completedById: t.Optional(t.String()),
});

// ---------------------------------------------------------------------------
// Helper to handle service errors
// ---------------------------------------------------------------------------

function handleServiceError(error: unknown, set: { status: number; [key: string]: unknown }) {
	if (error instanceof ThreadServiceError) {
		set.status = error.httpStatus;
		return fail(error.message, error.code);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

// ---------------------------------------------------------------------------
// Company guard helper
// ---------------------------------------------------------------------------

function assertCompanyId(
	companyContext: { companyId: string } | undefined | null,
	set: { status: number },
): string | null {
	const companyId = companyContext?.companyId;
	if (!companyId) {
		set.status = 401;
		fail("No autorizado", "UNAUTHORIZED");
		return null;
	}
	return companyId;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const threadRoutes = new Elysia({
	prefix: "/api/threads",
	name: "threads",
})
	.use(companyScopeGuard())

	// 1. GET / — List threads
	.get(
		"/",
		async ({ query, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = await threadsService.list(companyId, {
					status: query.status,
					period: query.period,
					priority: query.priority,
					search: query.search,
					limit: query.limit ? parseInt(query.limit, 10) : undefined,
					offset: query.offset ? parseInt(query.offset, 10) : undefined,
				});

				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			query: ListThreadsQuery,
			detail: {
				tags: ["Threads"],
				summary: "List threads",
				description: "List threads for the current company with pagination and filters",
			},
		},
	)

	// 2. POST / — Create thread
	.post(
		"/",
		async ({ body, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = await threadsService.create({
					title: body.title,
					description: body.description,
					environment: body.environment,
					period: body.period,
					priority: body.priority,
					tags: body.tags,
					tasks: body.tasks.map((t) => ({
						title: t.title,
						description: t.description,
						order: t.order ?? 0,
					})),
					companyId,
				});

				set.status = 201;
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			body: CreateThreadBody,
			detail: {
				tags: ["Threads"],
				summary: "Create a new thread",
				description: "Create a new thread with tasks",
			},
		},
	)

	// 3. GET /:id — Get thread detail
	.get(
		"/:id",
		async ({ params, set, companyContext }) => {
			try {
				const result = await threadsService.getById(
					params.id,
					companyContext?.companyId,
				);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			detail: {
				tags: ["Threads"],
				summary: "Get thread detail",
				description: "Get full thread detail with tasks, agents, and evidence",
			},
		},
	)

	// 4. PATCH /:id — Update thread
	.patch(
		"/:id",
		async ({ params, body, set }) => {
			try {
				const result = await threadsService.update(params.id, body);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			body: UpdateThreadBody,
			detail: {
				tags: ["Threads"],
				summary: "Update thread",
				description: "Update thread properties",
			},
		},
	)

	// 5. POST /:id/agents — Assign agent
	.post(
		"/:id/agents",
		async ({ params, body, set }) => {
			try {
				const result = await threadsService.assignAgent(
					params.id,
					body.agentId,
					body.agentName,
					body.role,
				);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			body: AssignAgentBody,
			detail: {
				tags: ["Threads"],
				summary: "Assign agent to thread",
				description: "Assign an AI agent to the thread",
			},
		},
	)

	// 6. DELETE /:id/agents/:agentId — Remove agent
	.delete(
		"/:id/agents/:agentId",
		async ({ params, set }) => {
			try {
				await threadsService.removeAgent(params.id, params.agentId);
				set.status = 204;
				return;
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: AgentParams,
			detail: {
				tags: ["Threads"],
				summary: "Remove agent from thread",
				description: "Soft-delete an agent assignment",
			},
		},
	)

	// 7. POST /:id/evidence — Link evidence
	.post(
		"/:id/evidence",
		async ({ params, body, set }) => {
			try {
				await threadsService.linkEvidence(
					params.id,
					body.evidenceId,
					body.note,
				);
				set.status = 201;
				return ok({ linked: true });
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			body: LinkEvidenceBody,
			detail: {
				tags: ["Threads"],
				summary: "Link evidence to thread",
				description: "Link evidence to the thread",
			},
		},
	)

	// 8. DELETE /:id/evidence/:evidenceId — Unlink evidence
	.delete(
		"/:id/evidence/:evidenceId",
		async ({ params, set }) => {
			try {
				await threadsService.unlinkEvidence(params.id, params.evidenceId);
				set.status = 204;
				return;
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: EvidenceParams,
			detail: {
				tags: ["Threads"],
				summary: "Unlink evidence from thread",
				description: "Remove evidence link from thread",
			},
		},
	)

	// 9. POST /:id/close — Close thread
	.post(
		"/:id/close",
		async ({ params, body, set, companyContext }) => {
			try {
				const userId = companyContext?.userId ?? companyContext?.authUserId;
				if (!userId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = await threadsService.closeThread(
					params.id,
					userId,
					body.closeNote,
				);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			body: CloseThreadBody,
			detail: {
				tags: ["Threads"],
				summary: "Close a thread",
				description: "Close a thread with optional note",
			},
		},
	)

	// 10. POST /:id/tasks — Create task
	.post(
		"/:id/tasks",
		async ({ params, body, set }) => {
			try {
				const result = await threadsService.createTask(params.id, body);
				set.status = 201;
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: ThreadParams,
			body: CreateTaskBody,
			detail: {
				tags: ["Threads"],
				summary: "Create a task in thread",
				description: "Create a new task within a thread",
			},
		},
	)

	// 11. PATCH /:id/tasks/:taskId — Update task
	.patch(
		"/:id/tasks/:taskId",
		async ({ params, body, set }) => {
			try {
				const result = await threadsService.updateTask(
					params.id,
					params.taskId,
					body,
				);
				return ok(result);
			} catch (error) {
				return handleServiceError(error, set as unknown as { status: number });
			}
		},
		{
			params: TaskParams,
			body: UpdateTaskBody,
			detail: {
				tags: ["Threads"],
				summary: "Update a task",
				description: "Update task status or properties",
			},
		},
	)

	// 12. GET /quick-actions — Get quick actions
	.get(
		"/quick-actions",
		async ({ query, set, companyContext }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = quickActionsService.getForCompany(
					companyId,
					query.period,
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: QuickActionsQuery,
			detail: {
				tags: ["Threads"],
				summary: "Get quick actions",
				description: "Get contextual quick actions based on company and period",
			},
		},
	);
