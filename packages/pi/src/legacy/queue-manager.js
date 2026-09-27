import { createId } from "@paralleldrive/cuid2";
const tasks = new Map();
export class QueueManager {
    async enqueue(dto) {
        const id = createId();
        const task = {
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
    async getStatusForCompany(taskId, companyId) {
        const task = tasks.get(taskId);
        if (!task || task.companyId !== companyId)
            return null;
        return task;
    }
    async getPendingForCompany(companyId, limit = 50, offset = 0) {
        const companyTasks = [];
        for (const task of tasks.values()) {
            if (task.companyId === companyId) {
                companyTasks.push(task);
            }
        }
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        companyTasks.sort((a, b) => {
            const pDiff = (priorityOrder[a.priority] ?? 99) -
                (priorityOrder[b.priority] ?? 99);
            if (pDiff !== 0)
                return pDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return companyTasks.slice(offset, offset + limit);
    }
    async getStatsForCompany(companyId) {
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
    async cancelTaskForCompany(taskId, companyId) {
        const task = tasks.get(taskId);
        if (!task || task.companyId !== companyId) {
            throw new Error(`Task ${taskId} not found for this company`);
        }
        task.status = "cancelled";
        task.updatedAt = new Date().toISOString();
    }
}
export const queueManager = new QueueManager();
//# sourceMappingURL=queue-manager.js.map