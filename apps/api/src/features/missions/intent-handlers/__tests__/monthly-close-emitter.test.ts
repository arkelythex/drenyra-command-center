/**
 * MissionEventStoreEmitter — unit tests.
 *
 * No monetary fields exist in the emitted events; Drenyra money values are
 * BigInt cents (repo-wide rule) and nothing here touches them.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MissionEventStore } from "../../sse/mission-event-store";
import { MissionEventStoreEmitter } from "../monthly-close-emitter";

function makeStore() {
	return {
		appendEvent: vi.fn().mockResolvedValue(1),
	} as unknown as MissionEventStore;
}

describe("MissionEventStoreEmitter", () => {
	let store: ReturnType<typeof makeStore>;
	let emitter: MissionEventStoreEmitter;

	beforeEach(() => {
		store = makeStore();
		emitter = new MissionEventStoreEmitter(store);
	});

	it("emits STEP_PROGRESS with step identity and metrics", async () => {
		await emitter.emitStepProgress("m-1", 3, "analyze-ledger", "COMPLETED", {
			durationMs: 42,
		});
		expect(store.appendEvent).toHaveBeenCalledWith("m-1", "STEP_PROGRESS", {
			stepNumber: 3,
			stepName: "analyze-ledger",
			status: "COMPLETED",
			metrics: { durationMs: 42 },
		});
	});

	it("emits BLOCKER_ADDED with the blockers", async () => {
		const blockers = [{ code: "E1", message: "blocked" }];
		await emitter.emitBlockers("m-1", blockers);
		expect(store.appendEvent).toHaveBeenCalledWith("m-1", "BLOCKER_ADDED", {
			blockers,
		});
	});

	it("emits PROPOSAL_CREATED with the proposal", async () => {
		const proposal = { entries: [] } as never;
		await emitter.emitProposalCreated("m-1", proposal);
		expect(store.appendEvent).toHaveBeenCalledWith("m-1", "PROPOSAL_CREATED", {
			proposal,
		});
	});

	it("emits STATE_TRANSITION with from/to", async () => {
		await emitter.emitStateTransition("m-1", "RUNNING", "WAITING_FOR_APPROVAL");
		expect(store.appendEvent).toHaveBeenCalledWith("m-1", "STATE_TRANSITION", {
			fromStatus: "RUNNING",
			toStatus: "WAITING_FOR_APPROVAL",
		});
	});
});
