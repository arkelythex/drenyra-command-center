import { describe, expect, it } from "vitest";
import type {
	DrenyraBrainEvent,
	DrenyraBrainItem,
	DrenyraBrainSourceSurface,
	DrenyraBrainThread,
	DrenyraBrainTurn,
	DrenyraFiscalScope,
} from "./types";

const fiscalScope: DrenyraFiscalScope = {
	organizationId: "org_123",
	companyId: "company_123",
	companyRuc: "20123456789",
	period: "2026-05",
	countryCode: "PE",
};

describe("Drenyra Brain domain contracts", () => {
	it("models a shared thread scoped to a Peruvian fiscal context", () => {
		const sourceSurface: DrenyraBrainSourceSurface = "cli";
		const thread: DrenyraBrainThread = {
			id: "brain_thread_123",
			title: "Review SIRE mismatch",
			fiscalScope,
			status: "active",
			sourceSurface,
			linkedCaseId: "case_123",
			createdBy: "user_123",
			createdAt: "2026-05-24T12:00:00.000Z",
			updatedAt: "2026-05-24T12:00:00.000Z",
		};

		expect(thread.fiscalScope.countryCode).toBe("PE");
		expect(thread.sourceSurface).toBe("cli");
	});

	it("models a turn linked to the same thread and fiscal scope", () => {
		const turn: DrenyraBrainTurn = {
			id: "brain_turn_123",
			threadId: "brain_thread_123",
			fiscalScope,
			status: "running",
			prompt: "Review this mismatch",
			sourceSurface: "web",
			createdBy: "user_123",
			createdAt: "2026-05-24T12:01:00.000Z",
			updatedAt: "2026-05-24T12:01:01.000Z",
		};

		expect(turn.threadId).toBe("brain_thread_123");
		expect(turn.status).toBe("running");
	});

	it("models timeline items and live events", () => {
		const item: DrenyraBrainItem = {
			id: "brain_item_123",
			threadId: "brain_thread_123",
			turnId: "brain_turn_123",
			fiscalScope,
			type: "user_message",
			content: { text: "Review this mismatch" },
			createdAt: "2026-05-24T12:01:00.000Z",
			actorId: "user_123",
			sourceSurface: "cli",
		};

		const event: DrenyraBrainEvent = {
			id: "brain_event_123",
			threadId: item.threadId,
			turnId: item.turnId,
			type: "item_appended",
			sequence: 1,
			itemId: item.id,
			createdAt: item.createdAt,
		};

		expect(item.type).toBe("user_message");
		expect(event.sequence).toBe(1);
	});
});
