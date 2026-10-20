/**
 * MonthlyCloseIntentHandler — a crashed pipeline never strands the mission.
 */

import type {
	MonthlyCloseMissionStore,
	MonthlyCloseOrchestrator,
} from "@drenyra/application/use-cases/monthly-close";
import { describe, expect, it, vi } from "vitest";
import { MonthlyCloseIntentHandler } from "../monthly-close-intent.handler";

function store() {
	return {
		load: vi.fn(),
		markBlocked: vi.fn(),
		markFailed: vi.fn().mockResolvedValue(undefined),
		markAwaitingApproval: vi.fn(),
	} satisfies MonthlyCloseMissionStore;
}

function crashingOrchestrator(error: Error) {
	return {
		execute: vi.fn().mockRejectedValue(error),
		applyEntries: vi.fn(),
	} as unknown as MonthlyCloseOrchestrator;
}

describe("MonthlyCloseIntentHandler crash handling", () => {
	it("marks the mission FAILED for its own company when the pipeline crashes", async () => {
		const missions = store();
		const handler = new MonthlyCloseIntentHandler(
			crashingOrchestrator(new Error("connection reset")),
			{},
			undefined,
			missions,
		);

		await handler.onRunning("m-1", "c-1");

		await vi.waitFor(() =>
			expect(missions.markFailed).toHaveBeenCalledWith(
				"m-1",
				"c-1",
				"connection reset",
			),
		);
	});

	it("swallows a failure to record the crash", async () => {
		const missions = store();
		missions.markFailed.mockRejectedValue(new Error("db down"));
		const handler = new MonthlyCloseIntentHandler(
			crashingOrchestrator(new Error("boom")),
			{},
			undefined,
			missions,
		);

		await expect(handler.onRunning("m-1", "c-1")).resolves.toBeUndefined();
		await vi.waitFor(() => expect(missions.markFailed).toHaveBeenCalled());
	});
});
