/**
 * Queue Manager — Minimal in-memory task queue
 *
 * Temporary implementation for the AI workers queue.
 * Will be replaced with a persistent backend (Redis/Postgres) in a future phase.
 *
 * @module @drenyra/pi/legacy
 */

import { createId } from "@paralleldrive/cuid2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateTaskDTO {
	companyId: string;
	userId: string;
	type: string;
	payload: Record<string, unknown>;
	priority: "low" | "medium" | "high" | "critical";
	maxRetries: number;
}

interface Task {
	id: string;
	companyId: string;
	userId: string;
	type: string;
	payload: Record<string, unknown>;
	priority: "low" | "medium" | "high" | "critical";
	maxRetries: number;
	status: "pending" | "running" | "completed" | "failed" | "cancelled";
	createdAt: string;
	updatedAt: string;
	retryCount: number;
	error?: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const tasks = new Map<string, Task>();

// ─── Queue Manager ────────────────────────────────────────────────────────────

export class QueueManager {
	async enqueue(dto: CreateTaskDTO): Promise<string> {
		const id = createId();

		const task: Task = {
			id,
			companyId: dto.companyId,
			userId: dto.userId,
			type: dto.type,
			payload: dto.payload,
			priority: dto.priority,
			maxRetries: dto.maxRetries,
			status: "pending",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			retryCount: 0,
		};

		tasks.set(id, task);
		return id;
	}

	async getStatusForCompany(
		taskId: string,
		companyId: string,
	): Promise<Task | null> {
		const task = tasks.get(taskId);
		if (!task || task.companyId !== companyId) return null;
		return task;
	}

	async getPendingForCompany(
		companyId: string,
		limit: number = 50,
		offset: number = 0,
	): Promise<Task[]> {
		const companyTasks: Task[] = [];

		for (const task of tasks.values()) {
			if (task.companyId === companyId) {
				companyTasks.push(task);
			}
		}

		// Sort by priority then createdAt (newest first)
		const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
		companyTasks.sort((a, b) => {
			const pDiff =
				(priorityOrder[a.priority] ?? 99) -
				(priorityOrder[b.priority] ?? 99);
			if (pDiff !== 0) return pDiff;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		return companyTasks.slice(offset, offset + limit);
	}

	async getStatsForCompany(companyId: string): Promise<{
		total: number;
		pending: number;
		running: number;
		completed: number;
		failed: number;
		cancelled: number;
	}> {
		const stats = {
			total: 0,
			pending: 0,
			running: 0,
			completed: 0,
			failed: 0,
			cancelled: 0,
		};

		for (const task of tasks.values()) {
			if (task.companyId === companyId) {
				stats.total++;
				switch (task.status) {
					case "pending":
						stats.pending++;
						break;
					case "running":
						stats.running++;
						break;
					case "completed":
						stats.completed++;
						break;
					case "failed":
						stats.failed++;
						break;
					case "cancelled":
						stats.cancelled++;
						break;
				}
			}
		}

		return stats;
	}

	async cancelTaskForCompany(
		taskId: string,
		companyId: string,
	): Promise<void> {
		const task = tasks.get(taskId);
		if (!task || task.companyId !== companyId) {
			throw new Error(`Task ${taskId} not found for this company`);
		}

		task.status = "cancelled";
		task.updatedAt = new Date().toISOString();
	}
}

export const queueManager = new QueueManager();
