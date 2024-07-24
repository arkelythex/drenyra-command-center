/**
 * CSV Batch Worker — Process each CSV batch chunk in parallel.
 */

import { type Job, Worker } from "bullmq";
import { loggers } from "../logger";
import type {
	CsvBatchJobData,
	CsvBatchResult,
} from "../queues/csv-batch.queue";
import { getRedisConnection, isRedisConfigured } from "../queues/redis";
import { validateWorkerScope } from "./scope-validator";

const CSV_BATCH_QUEUE = "csv-batch-agent";
const logger = loggers.worker;

async function processBatch(
	job: Job<CsvBatchJobData>,
): Promise<CsvBatchResult> {
	// Perimeter security: validate scope before any business logic
	validateWorkerScope(
		{ organizationId: String(job.data.orgId), companyId: job.data.companyId },
		"tenant",
	);

	const results: CsvBatchResult["results"] = [];

	for (const row of job.data.rows) {
		try {
			// Each row runs: categorize → calculate → report
			const category = await categorizeTransaction(row);
			const igv = calculateIgv(parseFloat(row.amount));
			results.push({
				transactionId: row.transactionId,
				success: true,
				category,
				igvAmount: igv,
			});
		} catch (err) {
			results.push({
				transactionId: row.transactionId,
				success: false,
				error: err instanceof Error ? err.message : "Unknown",
			});
		}
	}

	return {
		batchId: job.data.batchId,
		totalRows: job.data.rows.length,
		processedRows: results.filter((r) => r.success).length,
		failedRows: results.filter((r) => !r.success).length,
		completedJobs: 1,
		totalJobs: 1,
		results,
	};
}

async function categorizeTransaction(
	row: CsvBatchJobData["rows"][number],
): Promise<string> {
	// TODO: Integrate with PCGE agent for AI categorization
	// For now, rule-based fallback
	const desc = (row.description ?? "").toLowerCase();
	if (desc.includes("consultor") || desc.includes("servicio")) return "7011.11";
	if (
		desc.includes("compra") ||
		desc.includes("útil") ||
		desc.includes("oficina")
	)
		return "6011.11";
	if (desc.includes("planilla") || desc.includes("sueldo")) return "6211.11";
	if (
		desc.includes("luz") ||
		desc.includes("agua") ||
		desc.includes("teléfono")
	)
		return "6311.11";
	return "7099.99";
}

function calculateIgv(amount: number): number {
	return Math.round(amount * 0.18 * 100) / 100;
}

let worker: Worker | null = null;

export function startCsvBatchWorker(): Worker | null {
	if (!isRedisConfigured()) {
		logger.warn("Redis not configured — CSV batch worker not started");
		return null;
	}
	if (worker) return worker;

	worker = new Worker<CsvBatchJobData>(CSV_BATCH_QUEUE, processBatch, {
		connection: getRedisConnection() as never,
		concurrency: 10,
		lockDuration: 300_000,
	});

	worker.on("completed", (job) => {
		logger.info({ jobId: job.id }, "CSV batch job completed");
	});
	worker.on("failed", (job, err) => {
		logger.error(
			{ jobId: job?.id, error: err.message },
			"CSV batch job failed",
		);
	});

	return worker;
}

export function stopCsvBatchWorker(): void {
	worker?.close();
	worker = null;
}
