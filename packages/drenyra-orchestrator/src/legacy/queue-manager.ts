// @ts-nocheck — legacy code ported from @drenyra/agent-swarm, pending rewrite
/**
 * Queue Manager — ported from @drenyra/agent-swarm/src/queue/manager.ts
 *
 * Gestor de la cola de workers AI para procesamiento asíncrono.
 * Maneja enqueue, status, pending, retry con exponential backoff, y stats.
 */
import { db } from "@drenyra/infrastructure";
import { aiWorkerQueues } from "@drenyra/persistence/schema";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type {
	AIWorkerTask,
	CreateTaskDTO,
	QueueStatsDTO,
	TaskStatusDTO,
	WorkerTaskStatus,
} from "../types/index";

function calculateBackoffDelay(retryCount: number): number {
	const baseDelayMs = 2 ** retryCount * 1000;
	const maxDelayMs = 300000;
	return Math.min(baseDelayMs, maxDelayMs);
}

/**
 * QueueManager — maneja operaciones de la cola de workers AI.
 */
export class QueueManager {
	/** Encola una nueva tarea */
	async enqueue(task: CreateTaskDTO): Promise<string> {
		const taskId = this.generateTaskId();
		await db.insert(aiWorkerQueues).values({
			id: taskId,
			companyId: task.companyId,
			userId: task.userId,
			type: task.type,
			payload: task.payload,
			priority: task.priority ?? "medium",
			maxRetries: task.maxRetries ?? 3,
			status: "pending",
			retryCount: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return taskId;
	}

	/** Consulta estado de una tarea */
	async getStatus(taskId: string): Promise<TaskStatusDTO | null> {
		const [task] = await db
			.select()
			.from(aiWorkerQueues)
			.where(eq(aiWorkerQueues.id, taskId))
			.limit(1);
		return task ? this.mapToTaskStatusDTO(task as AIWorkerTask) : null;
	}

	/** Consulta estado de tarea scoped a companyId */
	async getStatusForCompany(
		taskId: string,
		companyId: string,
	): Promise<TaskStatusDTO | null> {
		const [task] = await db
			.select()
			.from(aiWorkerQueues)
			.where(
				and(
					eq(aiWorkerQueues.id, taskId),
					eq(aiWorkerQueues.companyId, companyId),
				),
			)
			.limit(1);
		return task ? this.mapToTaskStatusDTO(task as AIWorkerTask) : null;
	}

	/** Obtiene tareas pendientes */
	async getPending(limit = 10, offset = 0): Promise<AIWorkerTask[]> {
		return this.getPendingInternal(limit, offset);
	}

	/** Obtiene tareas pendientes scoped a companyId */
	async getPendingForCompany(
		companyId: string,
		limit = 10,
		offset = 0,
	): Promise<AIWorkerTask[]> {
		return this.getPendingInternal(limit, offset, companyId);
	}

	private async getPendingInternal(
		limit = 10,
		offset = 0,
		companyId?: string,
	): Promise<AIWorkerTask[]> {
		const companyConditions = companyId
			? [eq(aiWorkerQueues.companyId, companyId)]
			: [];
		const tasks = await db
			.select()
			.from(aiWorkerQueues)
			.where(
				and(
					...companyConditions,
					eq(aiWorkerQueues.status, "pending"),
					isNull(aiWorkerQueues.nextRetryAt),
				),
			)
			.orderBy(desc(aiWorkerQueues.priority), asc(aiWorkerQueues.createdAt))
			.limit(limit)
			.offset(offset);

		const retryTasks = await db
			.select()
			.from(aiWorkerQueues)
			.where(
				and(
					...companyConditions,
					eq(aiWorkerQueues.status, "pending"),
					isNotNull(aiWorkerQueues.nextRetryAt),
				),
			)
			.orderBy(asc(aiWorkerQueues.nextRetryAt))
			.limit(limit)
			.offset(offset);

		const taskMap = new Map<string, AIWorkerTask>();
		for (const task of [...tasks, ...retryTasks] as AIWorkerTask[]) {
			if (!taskMap.has(task.id)) {
				taskMap.set(task.id, task);
			}
		}
		return Array.from(taskMap.values()).slice(0, limit);
	}

	/** Tasks ready for processing (pending + retry due) */
	async getReadyForProcessing(limit = 10): Promise<AIWorkerTask[]> {
		const tasks = await db
			.select()
			.from(aiWorkerQueues)
			.where(
				and(
					eq(aiWorkerQueues.status, "pending"),
					isNull(aiWorkerQueues.nextRetryAt),
				),
			)
			.orderBy(desc(aiWorkerQueues.priority), asc(aiWorkerQueues.createdAt))
			.limit(limit);

		const retryTasks = await db
			.select()
			.from(aiWorkerQueues)
			.where(
				and(
					eq(aiWorkerQueues.status, "pending"),
					isNotNull(aiWorkerQueues.nextRetryAt),
				),
			)
			.orderBy(asc(aiWorkerQueues.nextRetryAt))
			.limit(limit);

		const seen = new Set<string>();
		const result: AIWorkerTask[] = [];
		for (const task of [...tasks, ...retryTasks] as AIWorkerTask[]) {
			if (!seen.has(task.id)) {
				seen.add(task.id);
				result.push(task);
			}
		}
		return result.slice(0, limit);
	}

	/** Marca tarea como en procesamiento */
	async markProcessing(taskId: string): Promise<void> {
		await db
			.update(aiWorkerQueues)
			.set({ status: "processing", startedAt: new Date(), updatedAt: new Date() })
			.where(eq(aiWorkerQueues.id, taskId));
	}

	/** Marca tarea como completada */
	async markCompleted(taskId: string, result: unknown): Promise<void> {
		await db
			.update(aiWorkerQueues)
			.set({
				status: "completed",
				result: result as Record<string, unknown>,
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(aiWorkerQueues.id, taskId));
	}

	/** Marca tarea como fallida con retry programado si es posible */
	async markFailed(taskId: string, error: string): Promise<void> {
		const [task] = await db
			.select()
			.from(aiWorkerQueues)
			.where(eq(aiWorkerQueues.id, taskId))
			.limit(1);

		if (!task) throw new Error(`Task ${taskId} not found`);

		const newRetryCount = task.retryCount + 1;
		const shouldRetry = newRetryCount < task.maxRetries;

		if (shouldRetry) {
			await db
				.update(aiWorkerQueues)
				.set({
					error,
					retryCount: newRetryCount,
					nextRetryAt: new Date(Date.now() + calculateBackoffDelay(newRetryCount)),
					updatedAt: new Date(),
				})
				.where(eq(aiWorkerQueues.id, taskId));
		} else {
			await db
				.update(aiWorkerQueues)
				.set({
					status: "failed",
					error,
					completedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(aiWorkerQueues.id, taskId));
		}
	}

	/** Programa retry para una tarea */
	async scheduleRetry(taskId: string): Promise<void> {
		const [task] = await db
			.select()
			.from(aiWorkerQueues)
			.where(eq(aiWorkerQueues.id, taskId))
			.limit(1);

		if (!task) throw new Error(`Task ${taskId} not found`);

		await db
			.update(aiWorkerQueues)
			.set({
				status: "pending",
				nextRetryAt: new Date(Date.now() + calculateBackoffDelay(task.retryCount)),
				updatedAt: new Date(),
			})
			.where(eq(aiWorkerQueues.id, taskId));
	}

	/** Estadísticas de la cola */
	async getStats(): Promise<QueueStatsDTO> {
		return this.getStatsInternal();
	}

	/** Estadísticas scoped a companyId */
	async getStatsForCompany(companyId: string): Promise<QueueStatsDTO> {
		return this.getStatsInternal(companyId);
	}

	private async getStatsInternal(companyId?: string): Promise<QueueStatsDTO> {
		const query = db.select().from(aiWorkerQueues);
		const allTasks = companyId
			? await query.where(eq(aiWorkerQueues.companyId, companyId))
			: await query;

		const stats: QueueStatsDTO = {
			pending: 0,
			processing: 0,
			completed: 0,
			failed: 0,
			total: allTasks.length,
		};

		for (const task of allTasks) {
			switch (task.status) {
				case "pending": stats.pending++; break;
				case "processing": stats.processing++; break;
				case "completed": stats.completed++; break;
				case "failed": stats.failed++; break;
			}
		}
		return stats;
	}

	/** Cancela tarea pendiente */
	async cancelTask(taskId: string): Promise<void> {
		await this.cancelTaskInternal(taskId);
	}

	/** Cancela tarea pendiente scoped a companyId */
	async cancelTaskForCompany(taskId: string, companyId: string): Promise<void> {
		await this.cancelTaskInternal(taskId, companyId);
	}

	private async cancelTaskInternal(
		taskId: string,
		companyId?: string,
	): Promise<void> {
		const conditions = companyId
			? [eq(aiWorkerQueues.companyId, companyId), eq(aiWorkerQueues.id, taskId), eq(aiWorkerQueues.status, "pending")]
			: [eq(aiWorkerQueues.id, taskId), eq(aiWorkerQueues.status, "pending")];

		await db
			.update(aiWorkerQueues)
			.set({ status: "failed", error: "Cancelled by user", completedAt: new Date(), updatedAt: new Date() })
			.where(and(...conditions));
	}

	private generateTaskId(): string {
		const timestamp = Date.now().toString(36);
		const randomPart = Math.random().toString(36).substring(2, 15);
		return `${timestamp}${randomPart}`.toUpperCase();
	}

	private mapToTaskStatusDTO(task: AIWorkerTask): TaskStatusDTO {
		return {
			id: task.id,
			status: task.status as WorkerTaskStatus,
			progress: task.status === "processing" ? 50 : undefined,
			result: task.result,
			error: task.error ?? undefined,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			startedAt: task.startedAt ?? undefined,
			completedAt: task.completedAt ?? undefined,
			retryCount: task.retryCount,
			maxRetries: task.maxRetries,
		};
	}
}

/** Singleton instance */
export const queueManager = new QueueManager();
