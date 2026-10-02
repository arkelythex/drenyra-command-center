import { AccountingMissionStatus } from "@drenyra/mission-protocol";
import { describe, expect, it, vi } from "vitest";
import { MissionRuntime } from "../mission-runtime";

type Event = { type: string; payload: Record<string, unknown> };

function setup(result: unknown, opts: { throws?: unknown } = {}) {
	const events: Event[] = [];
	const missionsService = {
		getMission: vi.fn(async () => ({ id: "m1", base: true })),
	};
	const eventStore = {
		appendEvent: vi.fn(
			async (_id: string, type: string, payload: Record<string, unknown>) => {
				events.push({ type, payload });
			},
		),
	};
	const orchestrator = {
		execute: vi.fn(async () => {
			if (opts.throws !== undefined) throw opts.throws;
			return result;
		}),
	};
	const runtime = new MissionRuntime(
		missionsService as never,
		eventStore as never,
		orchestrator as never,
	);
	return { runtime, events, orchestrator };
}

const last = (events: Event[]) => events[events.length - 1];

describe("MissionRuntime.executeMission", () => {
	it("starts by emitting RUNNING at progress 0", async () => {
		const { runtime, events } = setup({ status: "COMPLETED", missionId: "m1" });
		await runtime.executeMission("m1", "c1");
		expect(events[0].type).toBe("STATE_TRANSITION");
		expect(events[0].payload).toMatchObject({
			status: AccountingMissionStatus.RUNNING,
			progress: 0,
			currentStep: "initializing",
		});
	});

	it("COMPLETED emits COMPLETED at progress 10000", async () => {
		const { runtime, events } = setup({ status: "COMPLETED", missionId: "m1" });
		await runtime.executeMission("m1", "c1");
		expect(last(events)).toEqual({
			type: "COMPLETED",
			payload: expect.objectContaining({
				status: AccountingMissionStatus.COMPLETED,
				progress: 10000,
			}),
		});
	});

	it("BLOCKED emits the gate blockers; progress falls back to 0 when the result carries none", async () => {
		const blockers = [
			{
				gateType: "period_open",
				reason: "closed",
				blockedAt: "2026-06-30T00:00:00Z",
			},
		];
		const { runtime, events } = setup({
			status: "BLOCKED",
			missionId: "m1",
			blockers,
		});
		await runtime.executeMission("m1", "c1");
		expect(last(events).type).toBe("BLOCKER_ADDED");
		expect(last(events).payload).toMatchObject({
			status: AccountingMissionStatus.BLOCKED_BY_GATE,
			progress: 0,
			blockers,
		});
	});

	it("BLOCKED without blockers emits an empty list", async () => {
		const { runtime, events } = setup({ status: "BLOCKED", missionId: "m1" });
		await runtime.executeMission("m1", "c1");
		expect(last(events).payload).toMatchObject({ blockers: [] });
	});

	it("FAILED falls back to progress 0 and 'Unknown failure' when the result has no details", async () => {
		const { runtime, events } = setup({ status: "FAILED", missionId: "m1" });
		await runtime.executeMission("m1", "c1");
		expect(last(events).type).toBe("FAILED");
		expect(last(events).payload).toMatchObject({
			status: AccountingMissionStatus.FAILED,
			progress: 0,
			error: "Unknown failure",
		});
	});

	it("uses progress and error when the orchestrator result provides them", async () => {
		const { runtime, events } = setup({
			status: "FAILED",
			missionId: "m1",
			progress: 4200,
			error: "ledger mismatch",
		});
		await runtime.executeMission("m1", "c1");
		expect(last(events).payload).toMatchObject({
			progress: 4200,
			error: "ledger mismatch",
		});
	});

	it("a thrown non-transient error emits FAILED with the error text", async () => {
		const { runtime, events } = setup(undefined, { throws: new Error("boom") });
		await runtime.executeMission("m1", "c1");
		expect(last(events).type).toBe("FAILED");
		expect(String(last(events).payload.error)).toContain("boom");
	});
});
