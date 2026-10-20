/**
 * MonthlyCloseOrchestrator — persistence through MonthlyCloseMissionStore.
 *
 * The pipeline must leave the mission in a state the API can serve:
 * AWAITING_APPROVAL with a sealed proposal, BLOCKED with its blockers, or
 * FAILED with a reason. Never stuck in RUNNING.
 */

import { computeEvidenceBundleHash } from "@drenyra/domain";
import { describe, expect, it, vi } from "vitest";
import { MonthlyCloseOrchestrator } from "../monthly-close-orchestrator";
import type { MonthlyCloseMissionStore } from "../ports/monthly-close-mission-store";
import type { ClosingProposal } from "../types/pipeline-types";

const MISSION = { id: "m-1", companyId: "c-1", fiscalPeriod: "2026-06" };

function fakeStore(mission: typeof MISSION | null = MISSION) {
	return {
		load: vi.fn().mockResolvedValue(mission),
		markBlocked: vi.fn().mockResolvedValue(undefined),
		markFailed: vi.fn().mockResolvedValue(undefined),
		markAwaitingApproval: vi.fn().mockResolvedValue(undefined),
	} satisfies MonthlyCloseMissionStore;
}

function emitter() {
	return {
		emitStepProgress: vi.fn().mockResolvedValue(undefined),
		emitBlockers: vi.fn().mockResolvedValue(undefined),
		emitProposalCreated: vi.fn().mockResolvedValue(undefined),
		emitStateTransition: vi.fn().mockResolvedValue(undefined),
	};
}

function failingEmitter() {
	const boom = vi.fn().mockRejectedValue(new Error("event store down"));
	return {
		emitStepProgress: boom,
		emitBlockers: boom,
		emitProposalCreated: boom,
		emitStateTransition: boom,
	};
}

function fiscalAgent() {
	return {
		execute: vi.fn().mockResolvedValue({
			runId: "run-1",
			status: "SUCCESS",
			steps: [],
			summary: {
				totalTransactions: 10,
				categorized: 10,
				exceptions: 0,
				discrepancies: 0,
				completedSteps: [],
				failedSteps: [],
				durationMs: 1,
			},
			createdAt: new Date(),
		}),
	};
}

function orchestrator(
	store: MonthlyCloseMissionStore,
	events = emitter(),
	agent: unknown = fiscalAgent(),
) {
	const unused = {} as never;
	return new MonthlyCloseOrchestrator(
		store,
		agent,
		unused,
		unused,
		unused,
		unused,
		events,
	);
}

describe("MonthlyCloseOrchestrator with a mission store", () => {
	it("loads the mission scoped to the requesting company", async () => {
		const store = fakeStore();
		await orchestrator(store).execute("m-1", "c-1");
		expect(store.load).toHaveBeenCalledWith("m-1", "c-1");
	});

	it("persists AWAITING_APPROVAL with a proposal sealed by the canonical evidence hash", async () => {
		const store = fakeStore();
		const result = await orchestrator(store).execute("m-1", "c-1");

		expect(result.status).toBe("AWAITING_APPROVAL");
		expect(store.markAwaitingApproval).toHaveBeenCalledTimes(1);
		const [missionId, companyId, proposal] = store.markAwaitingApproval.mock
			.calls[0] as [string, string, ClosingProposal];
		expect([missionId, companyId]).toEqual(["m-1", "c-1"]);
		expect(proposal.sourceEvidence.length).toBeGreaterThan(0);
		expect(proposal.evidenceHash).toBe(
			await computeEvidenceBundleHash(proposal.sourceEvidence),
		);
		expect(store.markFailed).not.toHaveBeenCalled();
	});

	it("seals evidence that survives a jsonb round trip (keys reordered)", async () => {
		const store = fakeStore();
		await orchestrator(store).execute("m-1", "c-1");
		const proposal = store.markAwaitingApproval.mock
			.calls[0]?.[2] as ClosingProposal;
		const readBack = proposal.sourceEvidence.map((e) => ({
			uri: e.uri,
			type: e.type,
			id: e.id,
			hash: e.hash,
		}));
		expect(await computeEvidenceBundleHash(readBack)).toBe(
			proposal.evidenceHash,
		);
	});

	it("does nothing when the mission is not this company's", async () => {
		const store = fakeStore(null);
		const result = await orchestrator(store).execute("m-1", "c-other");

		expect(result.status).toBe("FAILED");
		expect(store.markFailed).not.toHaveBeenCalled();
		expect(store.markAwaitingApproval).not.toHaveBeenCalled();
	});

	it("marks the mission FAILED with the reason when a blocking step fails", async () => {
		vi.useFakeTimers();
		try {
			const store = fakeStore();
			const agent = {
				execute: vi
					.fn()
					.mockRejectedValue(new Error("FiscalAgent unavailable")),
			};
			const run = orchestrator(store, emitter(), agent).execute("m-1", "c-1");
			await vi.runAllTimersAsync();
			const result = await run;

			expect(result.status).toBe("FAILED");
			expect(store.markFailed).toHaveBeenCalledWith(
				"m-1",
				"c-1",
				expect.stringContaining("FiscalAgent unavailable"),
			);
			expect(store.markAwaitingApproval).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});

	it("still reaches AWAITING_APPROVAL when the event log is unavailable", async () => {
		const store = fakeStore();
		const result = await orchestrator(store, failingEmitter()).execute(
			"m-1",
			"c-1",
		);

		expect(result.status).toBe("AWAITING_APPROVAL");
		expect(store.markAwaitingApproval).toHaveBeenCalledTimes(1);
	});

	it("numbers steps from 1 on every run", async () => {
		const events = emitter();
		const o = orchestrator(fakeStore(), events);
		await o.execute("m-1", "c-1");
		events.emitStepProgress.mockClear();
		await o.execute("m-1", "c-1");

		expect(events.emitStepProgress.mock.calls[0]?.[1]).toBe(1);
	});
});
