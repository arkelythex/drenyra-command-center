import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import type {
	AIAnalysisJobData,
	EmailJobData,
	OCRJobData,
	ReportJobData,
	SUNATSubmissionJobData,
} from "./types";
import { QUEUE_NAMES } from "./types";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
});

export const ocrQueue = new Queue<OCRJobData>(QUEUE_NAMES.OCR_PROCESSING, {
	connection: redisConnection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 2000,
		},
		removeOnComplete: {
			age: 24 * 3600,
			count: 1000,
		},
		removeOnFail: {
			age: 7 * 24 * 3600,
		},
	},
});

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

export const sunatQueue = new Queue<SUNATSubmissionJobData>(
	QUEUE_NAMES.SUNAT_SUBMISSION,
	{
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 5,
			backoff: {
				type: "exponential",
				delay: 10000,
			},
		},
	},
);

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

export const ocrQueueEvents = new QueueEvents(QUEUE_NAMES.OCR_PROCESSING, {
	connection: redisConnection,
});
