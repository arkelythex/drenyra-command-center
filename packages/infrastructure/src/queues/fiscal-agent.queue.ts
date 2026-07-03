/**
 * Fiscal Agent Queue — BullMQ queue for scheduled nightly runs.
 */

import { Queue, QueueEvents } from "bullmq";
import { getRedisConnection, isRedisConfigured } from "./redis";

const FISCAL_AGENT_QUEUE = "fiscal-agent";

let queueInstance: Queue | null = null;
let queueEventsInstance: QueueEvents | null = null;

export interface FiscalAgentJobData {
	organizationId: number;
	companyId: string;
	period: string;
	countryCode: "PE" | "MX" | "CL" | "CO";
	userId?: string;
}

export function getFiscalAgentQueue(): Queue | null {
	if (!isRedisConfigured()) return null;
	if (!queueInstance) {
		queueInstance = new Queue(FISCAL_AGENT_QUEUE, {
			connection: getRedisConnection(),
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: "exponential", delay: 2000 },
				removeOnComplete: 100,
				removeOnFail: 50,
			},
		});
	}
	return queueInstance;
}

export function getFiscalAgentQueueEvents(): QueueEvents | null {
	if (!isRedisConfigured()) return null;
	if (!queueEventsInstance) {
		queueEventsInstance = new QueueEvents(FISCAL_AGENT_QUEUE, {
			connection: getRedisConnection(),
		});
	}
	return queueEventsInstance;
}

export async function scheduleNightlyRun(orgId: number, companyId: string, pattern = "0 2 * * *"): Promise<void> {
	const queue = getFiscalAgentQueue();
	if (!queue) return;

	await queue.upsertJobScheduler(
		`nightly-${orgId}`,
		{ pattern, tz: "America/Lima" },
		{
			name: `nightly-${orgId}`,
			data: {
				organizationId: orgId,
				companyId,
				period: getCurrentPeriod(),
				countryCode: "PE",
			} satisfies FiscalAgentJobData,
		},
	);
}

export async function triggerManualRun(data: FiscalAgentJobData): Promise<string | null> {
	const queue = getFiscalAgentQueue();
	if (!queue) return null;

	const job = await queue.add(`manual-${data.organizationId}`, data);
	return job.id ?? null;
}

function getCurrentPeriod(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	return `${year}${month}`;
}
