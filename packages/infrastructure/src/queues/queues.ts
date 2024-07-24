/**
 * BullMQ Queue Definitions and Worker Setup
 *
 * Defines all background job queues for async processing:
 * - OCR processing
 * - AI analysis
 * - SUNAT submission
 * - Email notifications
 */

import { type Job, Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// ============================================
// Redis Connection
// ============================================

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * redisConnection const.
 *
 * @example
 * ```ts
 * console.log(redisConnection);
 * ```
 */
export const redisConnection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null, // Required for BullMQ
	enableReadyCheck: false,
});

// ============================================
// Queue Names
// ============================================

/**
 * QUEUE_NAMES const.
 *
 * @example
 * ```ts
 * console.log(QUEUE_NAMES);
 * ```
 */
export const QUEUE_NAMES = {
	OCR_PROCESSING: "ocr-processing",
	AI_ANALYSIS: "ai-analysis",
	SUNAT_SUBMISSION: "sunat-submission",
	EMAIL_NOTIFICATION: "email-notification",
	REPORT_GENERATION: "report-generation",
} as const;

/**
 * QueueName type.
 *
 * @example
 * ```ts
 * const value: QueueName = {} as QueueName;
 * console.log(value);
 * ```
 */
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ============================================
// Job Data Types
// ============================================

/**
 * OCRJobData interface.
 *
 * @example
 * ```ts
 * const value: OCRJobData = {} as OCRJobData;
 * console.log(value);
 * ```
 */
export interface OCRJobData {
	documentId: string;
	fileUrl: string;
	organizationId: string;
	userId: string;
	mode: "standard" | "forensic";
}

/**
 * AIAnalysisJobData interface.
 *
 * @example
 * ```ts
 * const value: AIAnalysisJobData = {} as AIAnalysisJobData;
 * console.log(value);
 * ```
 */
export interface AIAnalysisJobData {
	documentId: string;
	analysisType:
		| "classification"
		| "validation"
		| "fraud_detection"
		| "antigravity";
	context?: Record<string, unknown>;
}

/**
 * SUNATSubmissionJobData interface.
 *
 * @example
 * ```ts
 * const value: SUNATSubmissionJobData = {} as SUNATSubmissionJobData;
 * console.log(value);
 * ```
 */
export interface SUNATSubmissionJobData {
	invoiceId: string;
	documentType: "factura" | "boleta" | "nota_credito" | "nota_debito";
	retryCount?: number;
}

/**
 * EmailJobData interface.
 *
 * @example
 * ```ts
 * const value: EmailJobData = {} as EmailJobData;
 * console.log(value);
 * ```
 */
export interface EmailJobData {
	to: string;
	template: string;
	data: Record<string, unknown>;
}

/**
 * ReportJobData interface.
 *
 * @example
 * ```ts
 * const value: ReportJobData = {} as ReportJobData;
 * console.log(value);
 * ```
 */
export interface ReportJobData {
	reportType: "balance" | "income" | "ledger" | "trial_balance";
	organizationId: string;
	dateFrom: string;
	dateTo: string;
	format: "pdf" | "excel" | "csv";
}

// ============================================
// Queue Instances
// ============================================

/**
 * ocrQueue const.
 *
 * @example
 * ```ts
 * console.log(ocrQueue);
 * ```
 */
export const ocrQueue = new Queue<OCRJobData>(QUEUE_NAMES.OCR_PROCESSING, {
	connection: redisConnection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 2000,
		},
		removeOnComplete: {
			age: 24 * 3600, // 24 hours
			count: 1000,
		},
		removeOnFail: {
			age: 7 * 24 * 3600, // 7 days
		},
	},
});

/**
 * aiAnalysisQueue const.
 *
 * @example
 * ```ts
 * console.log(aiAnalysisQueue);
 * ```
 */
export const aiAnalysisQueue = new Queue<AIAnalysisJobData>(
	QUEUE_NAMES.AI_ANALYSIS,
	{
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 2,
			backoff: {
				type: "fixed",
				delay: 5000,
			},
		},
	},
);

/**
 * sunatQueue const.
 *
 * @example
 * ```ts
 * console.log(sunatQueue);
 * ```
 */
export const sunatQueue = new Queue<SUNATSubmissionJobData>(
	QUEUE_NAMES.SUNAT_SUBMISSION,
	{
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 5, // SUNAT can be flaky
			backoff: {
				type: "exponential",
				delay: 10000,
			},
		},
	},
);

/**
 * emailQueue const.
 *
 * @example
 * ```ts
 * console.log(emailQueue);
 * ```
 */
export const emailQueue = new Queue<EmailJobData>(
	QUEUE_NAMES.EMAIL_NOTIFICATION,
	{
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
		},
	},
);

/**
 * reportQueue const.
 *
 * @example
 * ```ts
 * console.log(reportQueue);
 * ```
 */
export const reportQueue = new Queue<ReportJobData>(
	QUEUE_NAMES.REPORT_GENERATION,
	{
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 2,
			backoff: {
				type: "fixed",
				delay: 5000,
			},
		},
	},
);

// ============================================
// Queue Events (for monitoring)
// ============================================

/**
 * ocrQueueEvents const.
 *
 * @example
 * ```ts
 * console.log(ocrQueueEvents);
 * ```
 */
export const ocrQueueEvents = new QueueEvents(QUEUE_NAMES.OCR_PROCESSING, {
	connection: redisConnection,
});

// ============================================
// Job Addition Helpers
// ============================================

/**
 * Add OCR processing job
 * @param data - Input for data.
 * @param priority - Input for priority.
 * @returns Result of addOCRJob.
 * @example
 * ```ts
 * const result = await addOCRJob({} as OCRJobData, 0);
 * console.log(result);
 * ```
 */

export async function addOCRJob(
	data: OCRJobData,
	priority: number = 0,
): Promise<Job<OCRJobData>> {
	return ocrQueue.add("process-document", data, {
		priority,
		jobId: `ocr-${data.documentId}`, // Prevent duplicates
	});
}

/**
 * Add AI analysis job
 * @param data - Input for data.
 * @param delay - Input for delay.
 * @returns Result of addAIAnalysisJob.
 * @example
 * ```ts
 * const result = await addAIAnalysisJob({} as AIAnalysisJobData, 0);
 * console.log(result);
 * ```
 */

export async function addAIAnalysisJob(
	data: AIAnalysisJobData,
	delay?: number,
): Promise<Job<AIAnalysisJobData>> {
	return aiAnalysisQueue.add("analyze", data, {
		delay,
		jobId: `ai-${data.documentId}-${data.analysisType}`,
	});
}

/**
 * Add SUNAT submission job
 * @param data - Input for data.
 * @returns Result of addSUNATJob.
 * @example
 * ```ts
 * const result = await addSUNATJob({} as SUNATSubmissionJobData);
 * console.log(result);
 * ```
 */

export async function addSUNATJob(
	data: SUNATSubmissionJobData,
): Promise<Job<SUNATSubmissionJobData>> {
	return sunatQueue.add("submit", data, {
		jobId: `sunat-${data.invoiceId}`,
	});
}

/**
 * Add email notification job
 * @param data - Input for data.
 * @returns Result of addEmailJob.
 * @example
 * ```ts
 * const result = await addEmailJob({} as EmailJobData);
 * console.log(result);
 * ```
 */

export async function addEmailJob(
	data: EmailJobData,
): Promise<Job<EmailJobData>> {
	return emailQueue.add("send", data);
}

/**
 * Add report generation job
 * @param data - Input for data.
 * @returns Result of addReportJob.
 * @example
 * ```ts
 * const result = await addReportJob({} as ReportJobData);
 * console.log(result);
 * ```
 */

export async function addReportJob(
	data: ReportJobData,
): Promise<Job<ReportJobData>> {
	// Perimeter security: validate tenant scope before queuing
	if (!data.organizationId || !data.companyId) {
		throw new Error(
			"Report job requires organizationId and companyId for tenant isolation",
		);
	}

	return reportQueue.add("generate", data, {
		jobId: `report-${data.reportType}-${data.organizationId}-${Date.now()}`,
	});
}

// ============================================
// Queue Status
// ============================================

/**
 * getQueueStatus operation.
 *
 * @param queueName - Input for queueName.
 * @returns Result of getQueueStatus.
 * @example
 * ```ts
 * const result = await getQueueStatus({} as QueueName);
 * console.log(result);
 * ```
 */
export async function getQueueStatus(queueName: QueueName): Promise<{
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
}> {
	const queue = getQueueByName(queueName);

	const [waiting, active, completed, failed, delayed] = await Promise.all([
		queue.getWaitingCount(),
		queue.getActiveCount(),
		queue.getCompletedCount(),
		queue.getFailedCount(),
		queue.getDelayedCount(),
	]);

	return { waiting, active, completed, failed, delayed };
}

function getQueueByName(name: QueueName): Queue {
	switch (name) {
		case QUEUE_NAMES.OCR_PROCESSING:
			return ocrQueue;
		case QUEUE_NAMES.AI_ANALYSIS:
			return aiAnalysisQueue;
		case QUEUE_NAMES.SUNAT_SUBMISSION:
			return sunatQueue;
		case QUEUE_NAMES.EMAIL_NOTIFICATION:
			return emailQueue;
		case QUEUE_NAMES.REPORT_GENERATION:
			return reportQueue;
		default:
			throw new Error(`Unknown queue: ${name}`);
	}
}

// ============================================
// Cleanup
// ============================================

/**
 * closeQueues operation.
 *
 * @returns Result of closeQueues.
 * @example
 * ```ts
 * const result = await closeQueues();
 * console.log(result);
 * ```
 */
export async function closeQueues(): Promise<void> {
	await Promise.all([
		ocrQueue.close(),
		aiAnalysisQueue.close(),
		sunatQueue.close(),
		emailQueue.close(),
		reportQueue.close(),
		ocrQueueEvents.close(),
		redisConnection.quit(),
	]);
}
