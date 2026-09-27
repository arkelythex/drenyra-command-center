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
export declare class QueueManager {
    enqueue(dto: CreateTaskDTO): Promise<string>;
    getStatusForCompany(taskId: string, companyId: string): Promise<Task | null>;
    getPendingForCompany(companyId: string, limit?: number, offset?: number): Promise<Task[]>;
    getStatsForCompany(companyId: string): Promise<{
        total: number;
        pending: number;
        running: number;
        completed: number;
        failed: number;
        cancelled: number;
    }>;
    cancelTaskForCompany(taskId: string, companyId: string): Promise<void>;
}
export declare const queueManager: QueueManager;
export {};
//# sourceMappingURL=queue-manager.d.ts.map