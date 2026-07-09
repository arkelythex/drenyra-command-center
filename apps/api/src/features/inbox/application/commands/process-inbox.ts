/**
 * ProcessInboxCommand — Sets up an invoice batch processing pipeline with SSE streaming.
 *
 * Extracted from inline route handler for CQRS compliance.
 * The SSE stream construction remains here as it wraps the core orchestrator logic;
 * the route handler only sets response headers.
 *
 * @module inbox/application/commands
 */

import {
	createInboxBatchId,
	InvoiceOrchestrator,
} from "../../inbox.orchestrator";
import { createInboxSseStream } from "../../inbox.sse";

export interface ProcessInboxInput {
	companyId: string;
	files: File[];
}

export interface ProcessInboxResult {
	stream: ReadableStream<Uint8Array>;
	batchId: string;
}

/**
 * Creates an SSE ReadableStream for processing invoice files through the orchestrator.
 *
 * @param input - The company context and files to process
 * @returns The SSE stream and batch ID for response construction
 *
 * @example
 * ```ts
 * const { stream, batchId } = await processInbox({ companyId: 'cmp-123', files: [file1] });
 * ```
 */
export async function processInbox(
	input: ProcessInboxInput,
): Promise<ProcessInboxResult> {
	const { companyId, files } = input;
	const batchId = createInboxBatchId();

	const stream = createInboxSseStream(async (emit) => {
		const orchestrator = new InvoiceOrchestrator(emit);
		await orchestrator.processBatch({ companyId, batchId }, files);
	});

	return { stream, batchId };
}
