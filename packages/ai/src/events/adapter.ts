/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Agent Event Adapter
 *
 * Bridges the internal EventBus (workflow.types.ts) to the canonical typed
 * AgentEvent format from @drenyra/shared. Subscribes to all mapped workflow
 * event types and transforms each into the appropriate canonical variant.
 *
 * Non-blocking by design — mapping errors never propagate to the EventBus.
 *
 * @module events
 */

import { randomUUID } from "node:crypto";
import type { AgentEvent as CanonicalEvent } from "@drenyra/shared";
import type {
	EventBus,
	AgentEvent as WorkflowEvent,
	AgentEventType as WorkflowEventType,
} from "../agents/types/workflow.types";
import type { EventAdapter } from "./types";

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createEventAdapter(): EventAdapter {
	let eventBusRef: EventBus | null = null;
	let subscriptionIds: string[] = [];

	return {
		subscribe(eventBus, onEvent) {
			eventBusRef = eventBus;

			for (const entry of MAPPING) {
				const sub = eventBus.on(
					entry.workflowType as WorkflowEventType,
					(_event: WorkflowEvent) => {
						try {
							const mapped = entry.map(_event);
							if (mapped) {
								onEvent(mapped);
							}
						} catch {
							// Non-blocking: errors from mapping never propagate
						}
					},
				);
				subscriptionIds.push(sub.id);
			}
		},

		unsubscribe() {
			if (eventBusRef) {
				for (const id of subscriptionIds) {
					eventBusRef.off(id);
				}
			}
			subscriptionIds = [];
			eventBusRef = null;
		},
	};
}

// ─── Mapping Table ────────────────────────────────────────────────────────────

interface MappingEntry {
	workflowType: WorkflowEventType;
	map: (event: WorkflowEvent) => CanonicalEvent | null;
}

function toEpoch(ts: Date | number | string): number {
	if (typeof ts === "number") return ts;
	if (typeof ts === "string") return new Date(ts).getTime();
	return ts.getTime();
}

const MAPPING: MappingEntry[] = [
	{
		workflowType: "INVOICE_RECEIVED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "run_started" as const,
			payload: {
				runId: event.processId,
				startedAt: toEpoch(event.timestamp),
			},
		}),
	},

	{
		workflowType: "EXTRACTION_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.1, status: "Extracting data from invoice" },
		}),
	},
	{
		workflowType: "PARSING_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.25, status: "Parsing extracted fields" },
		}),
	},
	{
		workflowType: "VALIDATION_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.4, status: "Validating invoice data" },
		}),
	},
	{
		workflowType: "ARBITRATION_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.55, status: "Arbitrating discrepancies" },
		}),
	},
	{
		workflowType: "XML_GENERATION_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.7, status: "Generating UBL XML" },
		}),
	},
	{
		workflowType: "OSE_SUBMISSION_STARTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.85, status: "Submitting to OSE" },
		}),
	},

	{
		workflowType: "EXTRACTION_COMPLETE",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: {
				progress: 0.2,
				status: "Extraction complete",
				detail: "reader",
			},
		}),
	},
	{
		workflowType: "PARSING_COMPLETE",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.35, status: "Parsing complete" },
		}),
	},
	{
		workflowType: "PARSING_SKIPPED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: {
				progress: 0.35,
				status: "Parsing skipped",
				detail: (event as any).reason ?? "",
			},
		}),
	},
	{
		workflowType: "VALIDATION_COMPLETE",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.5, status: "Validation complete" },
		}),
	},
	{
		workflowType: "ARBITRATION_COMPLETED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.65, status: "Arbitration completed" },
		}),
	},
	{
		workflowType: "XML_GENERATED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.8, status: "XML generated" },
		}),
	},
	{
		workflowType: "OSE_SENT",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: { progress: 0.95, status: "OSE submission sent" },
		}),
	},

	{
		workflowType: "CONFLICT_DETECTED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "tool_result" as const,
			payload: {
				toolName: "validator",
				callId: event.processId,
				result: { conflicts: (event as any).conflicts ?? [] },
				duration: 0,
			},
		}),
	},

	{
		workflowType: "PROCESS_COMPLETED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "complete" as const,
			payload: {
				result: { invoiceNumber: (event as any).invoiceNumber ?? null },
				duration: (event as any).duration ?? (event as any).totalTime ?? 0,
				toolCalls: 0,
			},
		}),
	},

	{
		workflowType: "PROCESS_FAILED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "error" as const,
			payload: {
				code: "PROCESS_FAILED",
				message:
					typeof (event as any).error === "string"
						? (event as any).error
						: String(
								((event as any).error as Error)?.message ?? "Unknown error",
							),
			},
		}),
	},

	{
		workflowType: "OSE_FAILED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "tool_error" as const,
			payload: {
				toolName: "ose_submit",
				callId: event.processId,
				error: (event as any).error ?? "OSE submission failed",
			},
		}),
	},

	{
		workflowType: "MANUAL_REVIEW_REQUIRED",
		map: (event) => ({
			id: randomUUID(),
			runId: event.processId,
			timestamp: toEpoch(event.timestamp),
			type: "approval_required" as const,
			payload: {
				approvalId: `manual-${event.processId}`,
				toolName: "manual_review",
				args: { reason: (event as any).reason ?? "" },
				risk: "high" as const,
				reason: (event as any).reason ?? "Manual review required",
			},
		}),
	},

	{
		workflowType: "PRUNE_REQUESTED",
		map: () => null,
	},

	// --- Batch events → canonical event mapping ---
	{
		workflowType: "BATCH_STARTED",
		map: () => null,
	},
	{
		workflowType: "BATCH_PROGRESS",
		map: (event: any) => ({
			id: randomUUID(),
			runId: event.batchId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: {
				progress: event.total > 0 ? event.completed / event.total : 0,
				status: `Batch progress: ${event.completed}/${event.total} completed`,
			},
		}),
	},
	{
		workflowType: "BATCH_ITEM_COMPLETED",
		map: (event: any) => ({
			id: randomUUID(),
			runId: event.runId,
			timestamp: toEpoch(event.timestamp),
			type: "progress" as const,
			payload: {
				progress: 0,
				status: `Batch item ${event.itemIndex} completed`,
			},
		}),
	},
	{
		workflowType: "BATCH_ITEM_FAILED",
		map: (event: any) => ({
			id: randomUUID(),
			runId: event.runId,
			timestamp: toEpoch(event.timestamp),
			type: "error" as const,
			payload: {
				code: "BATCH_ITEM_FAILED",
				message: `Batch item ${event.itemIndex} failed: ${event.error}`,
			},
		}),
	},
	{
		workflowType: "BATCH_COMPLETED",
		map: (event: any) => ({
			id: randomUUID(),
			runId: event.batchId,
			timestamp: toEpoch(event.timestamp),
			type: "complete" as const,
			payload: {
				result: { completed: event.completed, total: event.total },
				duration: 0,
				toolCalls: 0,
			},
		}),
	},
	{
		workflowType: "BATCH_FAILED",
		map: (event: any) => ({
			id: randomUUID(),
			runId: event.batchId,
			timestamp: toEpoch(event.timestamp),
			type: "error" as const,
			payload: {
				code: "BATCH_FAILED",
				message: `Batch failed: ${event.error}`,
				details: {
					completed: event.completed,
					failed: event.failed,
					total: event.total,
				},
			},
		}),
	},
];
