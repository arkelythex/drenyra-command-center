import { Queue, QueueEvents } from "bullmq";
export interface DocumentJobData {
	companyId: string;
	documentId: string;
	fileUrl: string;
	fileType: "IMAGE" | "PDF" | "XML";
	fileName: string;
	clientId: string;
	userId: string;
	timestamp: number;
}
export interface DocumentJobResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	processingTimeMs: number;
	error?: string;
}
export declare function getDocumentQueue(): Queue | null;
export declare function getQueueEvents(): QueueEvents | null;
export declare function enqueueDocument(
	data: Omit<DocumentJobData, "timestamp">,
): Promise<string | null>;
export declare function enqueueBatch(
	documents: Omit<DocumentJobData, "timestamp">[],
): Promise<{
	queued: number;
	syncRequired: number;
}>;
export declare function getQueueStats(): Promise<{
	waiting: number;
	active: number;
	completed: number;
	failed: number;
} | null>;
export declare function closeQueue(): Promise<void>;
//# sourceMappingURL=document-processor.queue.d.ts.map
