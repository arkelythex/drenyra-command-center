export type QueuePriority = "critical" | "high" | "medium" | "low";
export type QueueStatus = "pending" | "reviewed" | "escalated";

export interface ReviewQueueItem {
	id: string;
	diffId: string;
	priority: QueuePriority;
	status: QueueStatus;
	assignedTo?: string;
	createdAt: Date;
}
