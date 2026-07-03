/**
 * CSV Batch Agent — Parallel processing via spawn_agents_on_csv pattern.
 * Splits CSV into chunks, spawns parallel BullMQ workers, consolidates results.
 */

import { Queue } from "bullmq";
import { getRedisConnection, isRedisConfigured } from "./redis";

const CSV_BATCH_QUEUE = "csv-batch-agent";
const BATCH_SIZE = 100;
const MAX_CONCURRENCY = 10;

export interface CsvBatchJobData {
	batchId: string;
	orgId: number;
	companyId: string;
	period: string;
	countryCode: "PE" | "MX" | "CL" | "CO";
	rows: CsvTransactionRow[];
}

export interface CsvTransactionRow {
	transactionId: string;
	amount: string;
	date: string;
	description: string;
	vendor?: string;
	taxId?: string;
}

export interface CsvBatchResult {
	batchId: string;
	totalRows: number;
	processedRows: number;
	failedRows: number;
	completedJobs: number;
	totalJobs: number;
	results: Array<{
		transactionId: string;
		success: boolean;
		category?: string;
		igvAmount?: number;
		error?: string;
	}>;
}

let queue: Queue | null = null;

export function getCsvBatchQueue(): Queue | null {
	if (!isRedisConfigured()) return null;
	if (!queue) {
		queue = new Queue(CSV_BATCH_QUEUE, {
			connection: getRedisConnection(),
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: "exponential", delay: 2000 },
				removeOnComplete: 200,
				removeOnFail: 100,
			},
		});
	}
	return queue;
}

/**
 * Parse a CSV string into rows. Supports quoted fields with commas.
 */
export function parseCsv(content: string): CsvTransactionRow[] {
	const lines = content.split("\n").filter((l) => l.trim());
	if (lines.length < 2) return [];

	const headers = parseCsvLine(lines[0]!);
	const rows: CsvTransactionRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const fields = parseCsvLine(lines[i]!);
		if (fields.length < 4) continue;

		rows.push({
			transactionId: fields[0] ?? `row-${i}`,
			amount: fields[1] ?? "0",
			date: fields[2] ?? "",
			description: fields[3] ?? "",
			vendor: fields[4],
			taxId: fields[5],
		});
	}

	return rows;
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			fields.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	fields.push(current.trim());
	return fields;
}

/**
 * Submit a CSV batch for processing. Splits into chunks and queues parallel jobs.
 */
export async function submitCsvBatch(params: {
	orgId: number;
	companyId: string;
	period: string;
	countryCode: "PE" | "MX" | "CL" | "CO";
	content: string;
}): Promise<{ batchId: string; totalJobs: number }> {
	const q = getCsvBatchQueue();
	if (!q) throw new Error("Redis not configured");

	const rows = parseCsv(params.content);
	const batchId = crypto.randomUUID();

	// Split into batches
	const batches: CsvTransactionRow[][] = [];
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		batches.push(rows.slice(i, i + BATCH_SIZE));
	}

	// Queue parallel jobs (up to MAX_CONCURRENCY at a time)
	let concurrencyIndex = 0;
	for (const batch of batches) {
		await q.add(
			`csv-batch-${batchId}-${concurrencyIndex + 1}`,
			{
				batchId,
				orgId: params.orgId,
				companyId: params.companyId,
				period: params.period,
				countryCode: params.countryCode,
				rows: batch,
			} satisfies CsvBatchJobData,
			{
				delay: concurrencyIndex < MAX_CONCURRENCY ? 0 : 1000,
			},
		);
		concurrencyIndex++;
	}

	return { batchId, totalJobs: batches.length };
}
