import type {
	AgentRole,
	TaskStatus,
	ThreadStatus,
} from "@drenyra/domain/entities/thread";
import { assertValidTransition, Thread } from "@drenyra/domain/entities/thread";
import type {
	ThreadAgentRole,
	ThreadTaskStatus,
} from "@drenyra/persistence/schema";
import { and, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { db, schema } from "../../lib/db";

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface ThreadFilters {
	status?: string;
	period?: string;
	priority?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}

export interface ThreadSummary {
	id: string;
	companyId: string;
	title: string;
	status: string;
	environment: string;
	period?: string;
	priority: string;
	tags: string[];
	taskCount: number;
	completedTaskCount: number;
	agentCount: number;
	lastActivityAt: string;
	createdAt: string;
}

export interface ThreadDetail {
	id: string;
	companyId: string;
	title: string;
	description?: string;
	status: string;
	environment: string;
	period?: string;
	priority: string;
	tags: string[];
	tasks: ThreadTaskDTO[];
	agents: ThreadAgentDTO[];
	evidenceIds: string[];
	createdById?: string;
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
	closedById?: string;
	closeNote?: string;
}

export interface ThreadTaskDTO {
	id: string;
	title: string;
	description?: string;
	status: string;
	agentId?: string;
	assignedAt?: string;
	completedAt?: string;
	completedById?: string;
	resultSummary?: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ThreadAgentDTO {
	agentId: string;
	agentName: string;
	role: string;
	isActive: boolean;
	assignedAt: string;
}

export interface CreateThreadData {
	companyId: string;
	title: string;
	description?: string;
	environment?: string;
	period?: string;
	priority?: string;
	tags?: string[];
	tasks: { title: string; description?: string; order: number }[];
	createdById?: string;
}

export interface UpdateThreadData {
	title?: string;
	description?: string;
	status?: string;
	priority?: string;
	environment?: string;
	tags?: string[];
	period?: string;
}

export interface AssignAgentData {
	agentId: string;
	agentName: string;
	role: string;
}

export interface CreateTaskData {
	title: string;
	description?: string;
	order?: number;
}

export interface UpdateTaskData {
	title?: string;
	description?: string;
	status?: string;
	agentId?: string;
	resultSummary?: string;
	completedById?: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ThreadServiceError extends Error {
	constructor(
		message: string,
		public code: string,
		public httpStatus: number = 400,
	) {
		super(message);
		this.name = "ThreadServiceError";
	}
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ThreadsService {
	async list(
		companyId: string,
		filters: ThreadFilters,
	): Promise<PaginatedResult<ThreadSummary>> {
		const limit = Math.min(filters.limit ?? 20, 100);
		const offset = filters.offset ?? 0;

		const conditions = [eq(schema.threads.companyId, companyId)];

		if (filters.status) {
			conditions.push(eq(schema.threads.status, filters.status as never));
		}
		if (filters.period) {
			conditions.push(eq(schema.threads.period, filters.period));
		}
		if (filters.priority) {
			conditions.push(eq(schema.threads.priority, filters.priority as never));
		}
		if (filters.search) {
			conditions.push(like(schema.threads.title, `%${filters.search}%`));
		}

		const where = and(...conditions);

		const [totalResult] = await db
			.select({ count: count() })
			.from(schema.threads)
			.where(where);

		const rows = await db
			.select({
				id: schema.threads.id,
				companyId: schema.threads.companyId,
				title: schema.threads.title,
				status: schema.threads.status,
				environment: schema.threads.environment,
				period: schema.threads.period,
				priority: schema.threads.priority,
				tags: schema.threads.tags,
				createdAt: schema.threads.createdAt,
				updatedAt: schema.threads.updatedAt,
			})
			.from(schema.threads)
			.where(where)
			.orderBy(desc(schema.threads.createdAt))
			.limit(limit)
			.offset(offset);

		const threadIds = rows.map((r) => r.id);
		const taskCounts = new Map<string, { total: number; completed: number }>();
		const agentCounts = new Map<string, number>();

		if (threadIds.length > 0) {
			const tasks = await db
				.select({
					threadId: schema.threadTasks.threadId,
					status: schema.threadTasks.status,
				})
				.from(schema.threadTasks)
				.where(inArray(schema.threadTasks.threadId, threadIds));

			for (const t of tasks) {
				const cur = taskCounts.get(t.threadId) ?? { total: 0, completed: 0 };
				cur.total++;
				if (t.status === "COMPLETED" || t.status === "SKIPPED") cur.completed++;
				taskCounts.set(t.threadId, cur);
			}

			const agents = await db
				.select({ threadId: schema.threadAgents.threadId })
				.from(schema.threadAgents)
				.where(
					and(
						inArray(schema.threadAgents.threadId, threadIds),
						eq(schema.threadAgents.isActive, true),
					),
				);

			for (const a of agents) {
				agentCounts.set(a.threadId, (agentCounts.get(a.threadId) ?? 0) + 1);
			}
		}

		const data: ThreadSummary[] = rows.map((r) => {
			const tc = taskCounts.get(r.id) ?? { total: 0, completed: 0 };
			return {
				id: r.id,
				companyId: r.companyId,
				title: r.title,
				status: r.status,
				environment: r.environment,
				period: r.period ?? undefined,
				priority: r.priority,
				tags: r.tags,
				taskCount: tc.total,
				completedTaskCount: tc.completed,
				agentCount: agentCounts.get(r.id) ?? 0,
				lastActivityAt: r.updatedAt.toISOString(),
				createdAt: r.createdAt.toISOString(),
			};
		});

		return {
			data,
			total: totalResult?.count ?? 0,
			limit,
			offset,
		};
	}

	async getById(id: string, companyId?: string): Promise<ThreadDetail> {
		const [threadRow] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, id))
			.limit(1);

		if (!threadRow) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}

		if (companyId && threadRow.companyId !== companyId) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}

		const tasks = await db
			.select()
			.from(schema.threadTasks)
			.where(eq(schema.threadTasks.threadId, id))
			.orderBy(schema.threadTasks.sortOrder);

		const agents = await db
			.select()
			.from(schema.threadAgents)
			.where(eq(schema.threadAgents.threadId, id))
			.orderBy(schema.threadAgents.assignedAt);

		const evidenceLinks = await db
			.select()
			.from(schema.threadEvidence)
			.where(eq(schema.threadEvidence.threadId, id));

		return {
			id: threadRow.id,
			companyId: threadRow.companyId,
			title: threadRow.title,
			description: threadRow.description ?? undefined,
			status: threadRow.status,
			environment: threadRow.environment,
			period: threadRow.period ?? undefined,
			priority: threadRow.priority,
			tags: threadRow.tags,
			tasks: tasks.map((t) => ({
				id: t.id,
				title: t.title,
				description: t.description ?? undefined,
				status: t.status,
				agentId: t.agentId ?? undefined,
				assignedAt: t.assignedAt?.toISOString(),
				completedAt: t.completedAt?.toISOString(),
				completedById: t.completedById ?? undefined,
				resultSummary: t.resultSummary ?? undefined,
				sortOrder: t.sortOrder,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString(),
			})),
			agents: agents.map((a) => ({
				agentId: a.agentId,
				agentName: a.agentName,
				role: a.role,
				isActive: a.isActive,
				assignedAt: a.assignedAt.toISOString(),
			})),
			evidenceIds: evidenceLinks.map((e) => e.evidenceId),
			createdById: threadRow.createdById ?? undefined,
			createdAt: threadRow.createdAt.toISOString(),
			updatedAt: threadRow.updatedAt.toISOString(),
			closedAt: threadRow.closedAt?.toISOString(),
			closedById: threadRow.closedById ?? undefined,
			closeNote: threadRow.closeNote ?? undefined,
		};
	}

	async create(data: CreateThreadData): Promise<ThreadSummary> {
		const threadId = crypto.randomUUID();
		const now = new Date();

		const taskProps = data.tasks.map((t, i) => ({
			id: crypto.randomUUID(),
			title: t.title,
			description: t.description,
			status: "PENDING" as TaskStatus,
			evidenceIds: [],
			order: t.order ?? i + 1,
			createdAt: now,
			updatedAt: now,
		}));

		const thread = Thread.create({
			id: threadId,
			companyId: data.companyId,
			title: data.title,
			description: data.description,
			status: "DRAFT",
			environment: (data.environment ?? "local") as Thread["environment"],
			period: data.period,
			priority: (data.priority ?? "MEDIUM") as Thread["priority"],
			tags: data.tags ?? [],
			tasks: taskProps,
			agentAssignments: [],
			evidenceIds: [],
			createdById: data.createdById ?? "",
			createdAt: now,
			updatedAt: now,
		});

		const [inserted] = await db
			.insert(schema.threads)
			.values({
				id: thread.id,
				companyId: thread.companyId,
				title: thread.title,
				description: thread.description,
				status: thread.status,
				environment: thread.environment,
				period: thread.period,
				priority: thread.priority,
				tags: thread.tags as string[],
				createdById: thread.createdById || null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		if (taskProps.length > 0) {
			await db.insert(schema.threadTasks).values(
				taskProps.map((t) => ({
					id: t.id,
					threadId: thread.id,
					title: t.title,
					description: t.description,
					status: t.status as ThreadTaskStatus,
					sortOrder: t.order,
					createdAt: now,
					updatedAt: now,
				})),
			);
		}

		return {
			id: inserted.id,
			companyId: inserted.companyId,
			title: inserted.title,
			status: inserted.status,
			environment: inserted.environment,
			period: inserted.period ?? undefined,
			priority: inserted.priority,
			tags: inserted.tags,
			taskCount: taskProps.length,
			completedTaskCount: 0,
			agentCount: 0,
			lastActivityAt: now.toISOString(),
			createdAt: now.toISOString(),
		};
	}

	async update(id: string, data: UpdateThreadData): Promise<ThreadSummary> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, id))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}

		if (existing.status === "CLOSED") {
			throw new ThreadServiceError(
				"Thread is already closed",
				"THREAD_ALREADY_CLOSED",
				409,
			);
		}

		const updateValues: Record<string, unknown> = { updatedAt: new Date() };

		if (data.title !== undefined) updateValues.title = data.title;
		if (data.description !== undefined)
			updateValues.description = data.description;
		if (data.priority !== undefined) updateValues.priority = data.priority;
		if (data.environment !== undefined)
			updateValues.environment = data.environment;
		if (data.tags !== undefined) updateValues.tags = data.tags;
		if (data.period !== undefined) updateValues.period = data.period;

		if (data.status !== undefined) {
			assertValidTransition(
				existing.status as ThreadStatus,
				data.status as ThreadStatus,
			);
			updateValues.status = data.status;
		}

		const [updated] = await db
			.update(schema.threads)
			.set(updateValues)
			.where(eq(schema.threads.id, id))
			.returning();

		return {
			id: updated.id,
			companyId: updated.companyId,
			title: updated.title,
			status: updated.status,
			environment: updated.environment,
			period: updated.period ?? undefined,
			priority: updated.priority,
			tags: updated.tags,
			taskCount: 0,
			completedTaskCount: 0,
			agentCount: 0,
			lastActivityAt: updated.updatedAt.toISOString(),
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async updateStatus(
		id: string,
		status: string,
		userId?: string,
		note?: string,
	): Promise<ThreadSummary> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, id))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}

		const taskRows = await db
			.select()
			.from(schema.threadTasks)
			.where(eq(schema.threadTasks.threadId, id));

		const thread = Thread.fromPrimitives({
			...existing,
			tasks: taskRows.map((t) => ({
				id: t.id,
				title: t.title,
				description: t.description ?? undefined,
				status: t.status,
				agentId: t.agentId ?? undefined,
				assignedAt: t.assignedAt ?? undefined,
				completedAt: t.completedAt ?? undefined,
				completedById: t.completedById ?? undefined,
				resultSummary: t.resultSummary ?? undefined,
				evidenceIds: t.evidenceIds,
				order: t.sortOrder,
				createdAt: t.createdAt,
				updatedAt: t.updatedAt,
			})),
			agentAssignments: [],
			evidenceIds: [],
		});

		let nextThread: Thread;

		switch (status) {
			case "ACTIVE":
				nextThread = thread.activate();
				break;
			case "BLOCKED":
				nextThread = thread.block(note ?? "Blocked");
				break;
			case "PENDING_REVIEW":
				nextThread = thread.submitForReview();
				break;
			case "AWAITING_INFO":
				nextThread = thread.awaitInfo();
				break;
			case "REVIEWED":
				nextThread = thread.review(true);
				break;
			case "CLOSED":
				if (!userId) {
					throw new ThreadServiceError(
						"userId is required to close a thread",
						"THREAD_INVALID_TRANSITION",
						422,
					);
				}
				nextThread = thread.close(userId, note);
				break;
			default:
				throw new ThreadServiceError(
					`Invalid status transition: ${thread.status} → ${status}`,
					"THREAD_INVALID_TRANSITION",
					409,
				);
		}

		const updateValues: Record<string, unknown> = {
			status: nextThread.status,
			updatedAt: new Date(),
		};

		if (nextThread.status === "CLOSED") {
			updateValues.closedById = userId;
			updateValues.closeNote = note ?? null;
			updateValues.closedAt = new Date();
		}

		const [updated] = await db
			.update(schema.threads)
			.set(updateValues)
			.where(eq(schema.threads.id, id))
			.returning();

		return {
			id: updated.id,
			companyId: updated.companyId,
			title: updated.title,
			status: updated.status,
			environment: updated.environment,
			period: updated.period ?? undefined,
			priority: updated.priority,
			tags: updated.tags,
			taskCount: taskRows.length,
			completedTaskCount: taskRows.filter(
				(t) => t.status === "COMPLETED" || t.status === "SKIPPED",
			).length,
			agentCount: 0,
			lastActivityAt: updated.updatedAt.toISOString(),
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async assignAgent(
		threadId: string,
		agentId: string,
		agentName: string,
		role: string,
	): Promise<ThreadAgentDTO> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, threadId))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}
		if (existing.status === "CLOSED") {
			throw new ThreadServiceError(
				"Thread is already closed",
				"THREAD_ALREADY_CLOSED",
				409,
			);
		}

		const now = new Date();
		const [inserted] = await db
			.insert(schema.threadAgents)
			.values({
				threadId,
				agentId,
				agentName,
				role: role as ThreadAgentRole,
				assignedAt: now,
				isActive: true,
			})
			.returning();

		return {
			agentId: inserted.agentId,
			agentName: inserted.agentName,
			role: inserted.role,
			isActive: inserted.isActive,
			assignedAt: inserted.assignedAt.toISOString(),
		};
	}

	async removeAgent(threadId: string, agentId: string): Promise<void> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, threadId))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}

		await db
			.update(schema.threadAgents)
			.set({ isActive: false, unassignedAt: new Date() })
			.where(
				and(
					eq(schema.threadAgents.threadId, threadId),
					eq(schema.threadAgents.agentId, agentId),
				),
			);
	}

	async linkEvidence(
		threadId: string,
		evidenceId: string,
		note?: string,
	): Promise<void> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, threadId))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}
		if (existing.status === "CLOSED") {
			throw new ThreadServiceError(
				"Thread is already closed",
				"THREAD_ALREADY_CLOSED",
				409,
			);
		}

		try {
			await db.insert(schema.threadEvidence).values({
				threadId,
				evidenceId,
				note: note ?? null,
				linkedAt: new Date(),
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes("unique") || message.includes("duplicate")) {
				throw new ThreadServiceError(
					"Evidence is already linked to this thread",
					"THREAD_EVIDENCE_ALREADY_LINKED",
					409,
				);
			}
			throw err;
		}
	}

	async unlinkEvidence(threadId: string, evidenceId: string): Promise<void> {
		await db
			.delete(schema.threadEvidence)
			.where(
				and(
					eq(schema.threadEvidence.threadId, threadId),
					eq(schema.threadEvidence.evidenceId, evidenceId),
				),
			);
	}

	async closeThread(
		id: string,
		userId: string,
		note?: string,
	): Promise<ThreadSummary> {
		return this.updateStatus(id, "CLOSED", userId, note);
	}

	async createTask(
		threadId: string,
		data: CreateTaskData,
	): Promise<ThreadTaskDTO> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, threadId))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}
		if (existing.status === "CLOSED") {
			throw new ThreadServiceError(
				"Thread is already closed",
				"THREAD_ALREADY_CLOSED",
				409,
			);
		}

		let order = data.order ?? 0;
		if (order === 0) {
			const [maxRow] = await db
				.select({ max: sql<number>`COALESCE(MAX(sort_order), 0)` })
				.from(schema.threadTasks)
				.where(eq(schema.threadTasks.threadId, threadId));
			order = (maxRow?.max ?? 0) + 1;
		}

		const now = new Date();
		const [inserted] = await db
			.insert(schema.threadTasks)
			.values({
				threadId,
				title: data.title,
				description: data.description,
				status: "PENDING" as ThreadTaskStatus,
				sortOrder: order,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return {
			id: inserted.id,
			title: inserted.title,
			description: inserted.description ?? undefined,
			status: inserted.status,
			agentId: inserted.agentId ?? undefined,
			assignedAt: inserted.assignedAt?.toISOString(),
			completedAt: inserted.completedAt?.toISOString(),
			completedById: inserted.completedById ?? undefined,
			resultSummary: inserted.resultSummary ?? undefined,
			sortOrder: inserted.sortOrder,
			createdAt: inserted.createdAt.toISOString(),
			updatedAt: inserted.updatedAt.toISOString(),
		};
	}

	async updateTask(
		threadId: string,
		taskId: string,
		data: UpdateTaskData,
	): Promise<ThreadTaskDTO> {
		const [existing] = await db
			.select()
			.from(schema.threads)
			.where(eq(schema.threads.id, threadId))
			.limit(1);

		if (!existing) {
			throw new ThreadServiceError("Thread not found", "THREAD_NOT_FOUND", 404);
		}
		if (existing.status === "CLOSED") {
			throw new ThreadServiceError(
				"Thread is already closed",
				"THREAD_ALREADY_CLOSED",
				409,
			);
		}

		const [taskRow] = await db
			.select()
			.from(schema.threadTasks)
			.where(
				and(
					eq(schema.threadTasks.id, taskId),
					eq(schema.threadTasks.threadId, threadId),
				),
			)
			.limit(1);

		if (!taskRow) {
			throw new ThreadServiceError("Task not found", "THREAD_NOT_FOUND", 404);
		}

		const updateValues: Record<string, unknown> = { updatedAt: new Date() };

		if (data.title !== undefined) updateValues.title = data.title;
		if (data.description !== undefined)
			updateValues.description = data.description;
		if (data.agentId !== undefined) updateValues.agentId = data.agentId;
		if (data.resultSummary !== undefined)
			updateValues.resultSummary = data.resultSummary;

		if (data.status !== undefined) {
			updateValues.status = data.status;
			if (data.status === "COMPLETED" || data.status === "FAILED") {
				updateValues.completedAt = new Date();
				if (data.completedById) updateValues.completedById = data.completedById;
			}
		}

		const [updated] = await db
			.update(schema.threadTasks)
			.set(updateValues)
			.where(eq(schema.threadTasks.id, taskId))
			.returning();

		return {
			id: updated.id,
			title: updated.title,
			description: updated.description ?? undefined,
			status: updated.status,
			agentId: updated.agentId ?? undefined,
			assignedAt: updated.assignedAt?.toISOString(),
			completedAt: updated.completedAt?.toISOString(),
			completedById: updated.completedById ?? undefined,
			resultSummary: updated.resultSummary ?? undefined,
			sortOrder: updated.sortOrder,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
		};
	}
}

export const threadsService = new ThreadsService();
