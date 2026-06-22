import { describe, expect, it } from "vitest";
import {
	appendWorkflowEventToNotes,
	deriveApprovalState,
	extractWorkflowEventsFromNotes,
	stripWorkflowEventsFromNotes,
} from "../workflow-trace";

describe("bill workflow trace", () => {
	it("derives approval state from bill status", () => {
		expect(deriveApprovalState("DRAFT")).toBe("NOT_STARTED");
		expect(deriveApprovalState("SENT")).toBe("PENDING");
		expect(deriveApprovalState("OVERDUE")).toBe("APPROVED");
		expect(deriveApprovalState("PAID")).toBe("APPROVED");
	});

	it("appends and extracts workflow events from notes", () => {
		const notes = appendWorkflowEventToNotes("Nota visible", {
			at: "2026-02-07T19:00:00.000Z",
			from: "DRAFT",
			to: "SENT",
			actorId: "usr-123",
			actorName: "Mariela Soto",
			reason: "Aprobacion inicial",
			approvalState: "PENDING",
		});

		const events = extractWorkflowEventsFromNotes(notes);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			from: "DRAFT",
			to: "SENT",
			actorName: "Mariela Soto",
			approvalState: "PENDING",
		});
	});

	it("removes internal trace lines from notes returned to clients", () => {
		const notesWithTrace = [
			"Pagar antes del viernes",
			'[BILL_WORKFLOW]{"at":"2026-02-07T19:00:00.000Z","from":"DRAFT","to":"SENT","approvalState":"PENDING"}',
		].join("\n");

		expect(stripWorkflowEventsFromNotes(notesWithTrace)).toBe(
			"Pagar antes del viernes",
		);
	});
});
