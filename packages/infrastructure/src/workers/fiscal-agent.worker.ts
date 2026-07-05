/**
 * Fiscal Agent Worker — Process fiscal agent jobs from the BullMQ queue.
 *
 * Runs the full FiscalNightlyRun pipeline for each job.
 */

import { FiscalNightlyRunUseCase } from "@drenyra/application/use-cases/fiscal-agent/fiscal-nightly-run.use-case";
import { type Job, Worker } from "bullmq";
import { loggers } from "../logger";
import type { FiscalAgentJobData } from "../queues/fiscal-agent.queue";
import { getRedisConnection, isRedisConfigured } from "../queues/redis";

const FISCAL_AGENT_QUEUE = "fiscal-agent";
const logger = loggers.worker;

let workerInstance: Worker | null = null;

const useCase = new FiscalNightlyRunUseCase();

async function processJob(job: Job<FiscalAgentJobData>): Promise<void> {
	logger.info(
		{ jobId: job.id, orgId: job.data.organizationId },
		"Processing fiscal agent job",
	);

	const report = await useCase.execute({
		organizationId: job.data.organizationId,
		companyId: job.data.companyId,
		period: job.data.period,
		countryCode: job.data.countryCode,
		userId: job.data.userId,
	});

	logger.info(
		{
			jobId: job.id,
			status: report.status,
			durationMs: report.summary.durationMs,
		},
		"Fiscal agent job completed",
	);
}

export function startFiscalAgentWorker(): Worker | null {
	if (!isRedisConfigured()) {
		logger.warn("Redis not configured — fiscal agent worker not started");
		return null;
	}

	if (workerInstance) return workerInstance;

	workerInstance = new Worker<FiscalAgentJobData>(
		FISCAL_AGENT_QUEUE,
		async (job) => {
			await processJob(job);
		},
		{
			connection: getRedisConnection() as never,
			concurrency: 3,
			lockDuration: 300_000, // 5 min
		},
	);

	workerInstance.on("completed", (job) => {
		logger.info({ jobId: job.id }, "Fiscal agent job completed successfully");
	});

	workerInstance.on("failed", (job, err) => {
		logger.error(
			{ jobId: job?.id, error: err.message },
			"Fiscal agent job failed",
		);
	});

	return workerInstance;
}

export function stopFiscalAgentWorker(): void {
	if (workerInstance) {
		workerInstance.close();
		workerInstance = null;
	}
}
