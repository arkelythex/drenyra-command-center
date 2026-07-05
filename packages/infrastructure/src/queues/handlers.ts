import type { Job, Queue } from "bullmq";
import {
	aiAnalysisQueue,
	emailQueue,
	ocrQueue,
	ocrQueueEvents,
	redisConnection,
	reportQueue,
	sunatQueue,
} from "./config";
import type {
	AIAnalysisJobData,
	EmailJobData,
	OCRJobData,
	QueueName,
	ReportJobData,
	SUNATSubmissionJobData,
} from "./types";
import { QUEUE_NAMES } from "./types";

export async function addOCRJob(
	data: OCRJobData,
	priority: number = 0,
): Promise<Job<OCRJobData>> {
	return ocrQueue.add("process-document", data, {
		priority,
		jobId: `ocr-${data.documentId}`,
	});
}

export async function addAIAnalysisJob(
	data: AIAnalysisJobData,
	delay?: number,
): Promise<Job<AIAnalysisJobData>> {
	return aiAnalysisQueue.add("analyze", data, {
		delay,
		jobId: `ai-${data.documentId}-${data.analysisType}`,
	});
}

export async function addSUNATJob(
	data: SUNATSubmissionJobData,
): Promise<Job<SUNATSubmissionJobData>> {
	return sunatQueue.add("submit", data, {
		jobId: `sunat-${data.invoiceId}`,
	});
}

export async function addEmailJob(
	data: EmailJobData,
): Promise<Job<EmailJobData>> {
	return emailQueue.add("send", data);
}

export async function addReportJob(
	data: ReportJobData,
): Promise<Job<ReportJobData>> {
	return reportQueue.add("generate", data, {
		jobId: `report-${data.reportType}-${data.organizationId}-${Date.now()}`,
	});
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
