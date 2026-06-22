/**
 * Document Processor Queue
 *
 * BullMQ queue for processing uploaded documents asynchronously.
 * Implements the "Fire and Forget" pattern.
 */

import { Queue, QueueEvents } from "bullmq";
import { loggers } from "../logger";
import { getRedisConnection, isRedisConfigured } from "./redis";

/**
 * DocumentJobData interface.
 *
 * @example
 * ```ts
 * const value: DocumentJobData = {} as DocumentJobData;
 * console.log(value);
 * ```
 */
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

/**
 * DocumentJobResult interface.
 *
 * @example
 * ```ts
 * const value: DocumentJobResult = {} as DocumentJobResult;
 * console.log(value);
 * ```
 */
export interface DocumentJobResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	processingTimeMs: number;
	error?: string;
}

let documentQueue: Queue | null = null;
let queueEvents: QueueEvents | null = null;

const QUEUE_NAME = "document-processing";

/**
 * Get or create the document processing queue
 * @returns Result of getDocumentQueue.
 * @example
 * ```ts
 * const result = getDocumentQueue();
 * console.log(result);
 * ```
 */

export function getDocumentQueue(): Queue | null {
	if (!isRedisConfigured()) {
		loggers.queue.warn("Redis no configurado - procesamiento será síncrono");
		return null;
	}

	if (!documentQueue) {
		const connection = getRedisConnection();

		documentQueue = new Queue(QUEUE_NAME, {
			connection: connection as never,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: {
					age: 24 * 60 * 60, // 24 hours
					count: 1000,
				},
				removeOnFail: {
					age: 7 * 24 * 60 * 60, // 7 days
				},
			},
		});

		loggers.queue.info("Document queue created", { queueName: QUEUE_NAME });
	}

	return documentQueue;
}

/**
 * Get queue events for monitoring
 * @returns Result of getQueueEvents.
 * @example
 * ```ts
 * const result = getQueueEvents();
 * console.log(result);
 * ```
 */

export function getQueueEvents(): QueueEvents | null {
	if (!isRedisConfigured()) return null;

	if (!queueEvents) {
		const connection = getRedisConnection();
		queueEvents = new QueueEvents(QUEUE_NAME, {
			connection: connection as never,
		});
	}

	return queueEvents;
}

/**
 * Enqueue a document for processing
 * @param data - Input for data.
 * @returns Result of enqueueDocument.
 * @example
 * ```ts
 * const result = await enqueueDocument({} as Omit);
 * console.log(result);
 * ```
 */

export async function enqueueDocument(
	data: Omit<DocumentJobData, "timestamp">,
): Promise<string | null> {
	const queue = getDocumentQueue();

	if (!queue) {
		// Redis not available - return null to indicate sync processing needed
		loggers.queue.info("Document will be processed synchronously", {
			documentId: data.documentId,
		});
		return null;
	}

	const job = await queue.add(
		"process-document",
		{
			...data,
			timestamp: Date.now(),
		},
		{
			jobId: data.documentId, // Use document ID as job ID for idempotency
			priority: data.fileType === "XML" ? 1 : 2, // XML has higher priority (faster)
		},
	);

	loggers.queue.info("Document enqueued", {
		documentId: data.documentId,
		jobId: job.id,
	});

	return job.id || null;
}

/**
 * Enqueue multiple documents for batch processing
 * @param documents - Input for documents.
 * @returns Result of enqueueBatch.
 * @example
 * ```ts
 * const result = await enqueueBatch([]);
 * console.log(result);
 * ```
 */

export async function enqueueBatch(
	documents: Omit<DocumentJobData, "timestamp">[],
): Promise<{
	queued: number;
	syncRequired: number;
}> {
	const queue = getDocumentQueue();

	if (!queue) {
		return {
			queued: 0,
			syncRequired: documents.length,
		};
	}

	const jobs = documents.map((doc) => ({
		name: "process-document",
		data: {
			...doc,
			timestamp: Date.now(),
		},
		opts: {
			jobId: doc.documentId,
			priority: doc.fileType === "XML" ? 1 : 2,
		},
	}));

	await queue.addBulk(jobs);

	loggers.queue.info("Batch enqueued", { count: documents.length });

	return {
		queued: documents.length,
		syncRequired: 0,
	};
}

/**
 * Get queue statistics
 * @returns Result of getQueueStats.
 * @example
 * ```ts
 * const result = await getQueueStats();
 * console.log(result);
 * ```
 */

export async function getQueueStats() {
	const queue = getDocumentQueue();

	if (!queue) {
		return null;
	}

	const [waiting, active, completed, failed] = await Promise.all([
		queue.getWaitingCount(),
		queue.getActiveCount(),
		queue.getCompletedCount(),
		queue.getFailedCount(),
	]);

	return {
		waiting,
		active,
		completed,
		failed,
	};
}

/**
 * Close queue connections
 * @returns Result of closeQueue.
 * @example
 * ```ts
 * const result = await closeQueue();
 * console.log(result);
 * ```
 */

export async function closeQueue(): Promise<void> {
	if (queueEvents) {
		await queueEvents.close();
		queueEvents = null;
	}

	if (documentQueue) {
		await documentQueue.close();
		documentQueue = null;
	}

	loggers.queue.info("Document queue closed");
}
