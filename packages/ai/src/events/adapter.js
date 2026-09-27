import { randomUUID } from "node:crypto";
export function createEventAdapter() {
    let eventBusRef = null;
    let subscriptionIds = [];
    return {
        subscribe(eventBus, onEvent) {
            eventBusRef = eventBus;
            for (const entry of MAPPING) {
                const sub = eventBus.on(entry.workflowType, (_event) => {
                    try {
                        const mapped = entry.map(_event);
                        if (mapped) {
                            onEvent(mapped);
                        }
                    }
                    catch {
                    }
                });
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
function toEpoch(ts) {
    if (typeof ts === "number")
        return ts;
    if (typeof ts === "string")
        return new Date(ts).getTime();
    return ts.getTime();
}
const MAPPING = [
    {
        workflowType: "INVOICE_RECEIVED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "run_started",
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
            type: "progress",
            payload: { progress: 0.1, status: "Extracting data from invoice" },
        }),
    },
    {
        workflowType: "PARSING_STARTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.25, status: "Parsing extracted fields" },
        }),
    },
    {
        workflowType: "VALIDATION_STARTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.4, status: "Validating invoice data" },
        }),
    },
    {
        workflowType: "ARBITRATION_STARTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.55, status: "Arbitrating discrepancies" },
        }),
    },
    {
        workflowType: "XML_GENERATION_STARTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.7, status: "Generating UBL XML" },
        }),
    },
    {
        workflowType: "OSE_SUBMISSION_STARTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.85, status: "Submitting to OSE" },
        }),
    },
    {
        workflowType: "EXTRACTION_COMPLETE",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
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
            type: "progress",
            payload: { progress: 0.35, status: "Parsing complete" },
        }),
    },
    {
        workflowType: "PARSING_SKIPPED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: {
                progress: 0.35,
                status: "Parsing skipped",
                detail: event.reason ?? "",
            },
        }),
    },
    {
        workflowType: "VALIDATION_COMPLETE",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.5, status: "Validation complete" },
        }),
    },
    {
        workflowType: "ARBITRATION_COMPLETED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.65, status: "Arbitration completed" },
        }),
    },
    {
        workflowType: "XML_GENERATED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.8, status: "XML generated" },
        }),
    },
    {
        workflowType: "OSE_SENT",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: { progress: 0.95, status: "OSE submission sent" },
        }),
    },
    {
        workflowType: "CONFLICT_DETECTED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "tool_result",
            payload: {
                toolName: "validator",
                callId: event.processId,
                result: { conflicts: event.conflicts ?? [] },
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
            type: "complete",
            payload: {
                result: { invoiceNumber: event.invoiceNumber ?? null },
                duration: event.duration ?? event.totalTime ?? 0,
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
            type: "error",
            payload: {
                code: "PROCESS_FAILED",
                message: typeof event.error === "string"
                    ? event.error
                    : String(event.error?.message ?? "Unknown error"),
            },
        }),
    },
    {
        workflowType: "OSE_FAILED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "tool_error",
            payload: {
                toolName: "ose_submit",
                callId: event.processId,
                error: event.error ?? "OSE submission failed",
            },
        }),
    },
    {
        workflowType: "MANUAL_REVIEW_REQUIRED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.processId,
            timestamp: toEpoch(event.timestamp),
            type: "approval_required",
            payload: {
                approvalId: `manual-${event.processId}`,
                toolName: "manual_review",
                args: { reason: event.reason ?? "" },
                risk: "high",
                reason: event.reason ?? "Manual review required",
            },
        }),
    },
    {
        workflowType: "PRUNE_REQUESTED",
        map: () => null,
    },
    {
        workflowType: "BATCH_STARTED",
        map: () => null,
    },
    {
        workflowType: "BATCH_PROGRESS",
        map: (event) => ({
            id: randomUUID(),
            runId: event.batchId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: {
                progress: event.total > 0 ? event.completed / event.total : 0,
                status: `Batch progress: ${event.completed}/${event.total} completed`,
            },
        }),
    },
    {
        workflowType: "BATCH_ITEM_COMPLETED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.runId,
            timestamp: toEpoch(event.timestamp),
            type: "progress",
            payload: {
                progress: 0,
                status: `Batch item ${event.itemIndex} completed`,
            },
        }),
    },
    {
        workflowType: "BATCH_ITEM_FAILED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.runId,
            timestamp: toEpoch(event.timestamp),
            type: "error",
            payload: {
                code: "BATCH_ITEM_FAILED",
                message: `Batch item ${event.itemIndex} failed: ${event.error}`,
            },
        }),
    },
    {
        workflowType: "BATCH_COMPLETED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.batchId,
            timestamp: toEpoch(event.timestamp),
            type: "complete",
            payload: {
                result: { completed: event.completed, total: event.total },
                duration: 0,
                toolCalls: 0,
            },
        }),
    },
    {
        workflowType: "BATCH_FAILED",
        map: (event) => ({
            id: randomUUID(),
            runId: event.batchId,
            timestamp: toEpoch(event.timestamp),
            type: "error",
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
//# sourceMappingURL=adapter.js.map