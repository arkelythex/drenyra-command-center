import type { BillStatus } from "../../domain/bill.entity";

/**
 * BillApprovalState type.
 *
 * @example
 * ```ts
 * const value: BillApprovalState = {} as BillApprovalState;
 * console.log(value);
 * ```
 */
export type BillApprovalState = "NOT_STARTED" | "PENDING" | "APPROVED";

/**
 * BillWorkflowEvent type.
 *
 * @example
 * ```ts
 * const value: BillWorkflowEvent = {} as BillWorkflowEvent;
 * console.log(value);
 * ```
 */
export type BillWorkflowEvent = {
	at: string;
	from: BillStatus;
	to: BillStatus;
	actorId?: string;
	actorName?: string;
	reason?: string;
	approvalState: BillApprovalState;
};

const WORKFLOW_PREFIX = "[BILL_WORKFLOW]";
const VALID_STATUSES = new Set<BillStatus>([
	"DRAFT",
	"SENT",
	"PAID",
	"OVERDUE",
	"CANCELLED",
]);
const VALID_APPROVAL_STATES = new Set<BillApprovalState>([
	"NOT_STARTED",
	"PENDING",
	"APPROVED",
]);

/**
 * deriveApprovalState operation.
 *
 * @param status - Input for status.
 * @returns Result of deriveApprovalState.
 * @example
 * ```ts
 * const result = deriveApprovalState({} as BillStatus);
 * console.log(result);
 * ```
 */
export function deriveApprovalState(status: BillStatus): BillApprovalState {
	if (status === "SENT") return "PENDING";
	if (status === "OVERDUE" || status === "PAID") return "APPROVED";
	return "NOT_STARTED";
}

/**
 * appendWorkflowEventToNotes operation.
 *
 * @param notes - Input for notes.
 * @param event - Input for event.
 * @returns Result of appendWorkflowEventToNotes.
 * @example
 * ```ts
 * const result = appendWorkflowEventToNotes("", {} as BillWorkflowEvent);
 * console.log(result);
 * ```
 */
export function appendWorkflowEventToNotes(
	notes: string | null | undefined,
	event: BillWorkflowEvent,
): string {
	const current = typeof notes === "string" ? notes.trimEnd() : "";
	const serialized = `${WORKFLOW_PREFIX}${JSON.stringify(event)}`;
	return current.length > 0 ? `${current}\n${serialized}` : serialized;
}

/**
 * extractWorkflowEventsFromNotes operation.
 *
 * @param notes - Input for notes.
 * @returns Result of extractWorkflowEventsFromNotes.
 * @example
 * ```ts
 * const result = extractWorkflowEventsFromNotes("");
 * console.log(result);
 * ```
 */
export function extractWorkflowEventsFromNotes(
	notes: string | null | undefined,
): BillWorkflowEvent[] {
	if (!notes) return [];

	const events: BillWorkflowEvent[] = [];
	for (const line of notes.split("\n")) {
		if (!line.startsWith(WORKFLOW_PREFIX)) continue;

		const json = line.slice(WORKFLOW_PREFIX.length);
		try {
			const parsed = JSON.parse(json) as BillWorkflowEvent;
			if (
				parsed &&
				typeof parsed.at === "string" &&
				typeof parsed.from === "string" &&
				typeof parsed.to === "string" &&
				typeof parsed.approvalState === "string" &&
				VALID_STATUSES.has(parsed.from as BillStatus) &&
				VALID_STATUSES.has(parsed.to as BillStatus) &&
				VALID_APPROVAL_STATES.has(parsed.approvalState as BillApprovalState)
			) {
				events.push(parsed);
			}
		} catch {
			// Skip malformed trace rows to preserve backwards compatibility.
		}
	}

	return events;
}

/**
 * stripWorkflowEventsFromNotes operation.
 *
 * @param notes - Input for notes.
 * @returns Result of stripWorkflowEventsFromNotes.
 * @example
 * ```ts
 * const result = stripWorkflowEventsFromNotes("");
 * console.log(result);
 * ```
 */
export function stripWorkflowEventsFromNotes(
	notes: string | null | undefined,
): string | undefined {
	if (!notes) return undefined;

	const cleaned = notes
		.split("\n")
		.filter((line) => !line.startsWith(WORKFLOW_PREFIX))
		.join("\n")
		.trim();

	return cleaned.length > 0 ? cleaned : undefined;
}
