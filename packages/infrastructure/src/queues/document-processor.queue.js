import { Queue, QueueEvents } from "bullmq";
import { loggers } from "../logger";
import { getRedisConnection, isRedisConfigured } from "./redis";

let documentQueue = null;
let queueEvents = null;
const QUEUE_NAME = "document-processing";
export function getDocumentQueue() {
	if (!isRedisConfigured()) {
		loggers.queue.warn("Redis no configurado - procesamiento será síncrono");
		return null;
	}
	if (!documentQueue) {
		const connection = getRedisConnection();
		documentQueue = new Queue(QUEUE_NAME, {
			connection: connection,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: {
					age: 24 * 60 * 60,
					count: 1000,
				},
				removeOnFail: {
					age: 7 * 24 * 60 * 60,
				},
			},
		});
		loggers.queue.info("Document queue created", { queueName: QUEUE_NAME });
	}
	return documentQueue;
}
export function getQueueEvents() {
	if (!isRedisConfigured()) return null;
	if (!queueEvents) {
		const connection = getRedisConnection();
		queueEvents = new QueueEvents(QUEUE_NAME, {
			connection: connection,
		});
	}
	return queueEvents;
}
export async function enqueueDocument(data) {
	const queue = getDocumentQueue();
	if (!queue) {
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
			jobId: data.documentId,
			priority: data.fileType === "XML" ? 1 : 2,
		},
	);
	loggers.queue.info("Document enqueued", {
		documentId: data.documentId,
		jobId: job.id,
	});
	return job.id || null;
}
export async function enqueueBatch(documents) {
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
export async function closeQueue() {
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

