import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAgentRunStore } from "../in-memory-run-store.js";
import type { OSAgentRun } from "../types.js";

function sampleRun(overrides: Partial<OSAgentRun> = {}): OSAgentRun {
	return {
		id: "run-1",
		vertical: "drenyra",
		userId: "user-1",
		prompt: "test prompt",
		response: "test response",
		tools: [],
		approvalStatus: "auto",
		riskLevel: "auto",
		tokensUsed: 100,
		durationMs: 500,
		timestamp: new Date(),
		...overrides,
	};
}

describe("InMemoryAgentRunStore", () => {
	let store: InMemoryAgentRunStore;

	beforeEach(() => {
		store = new InMemoryAgentRunStore();
	});

	it("should record a run and retrieve by id", () => {
		store.record(sampleRun());
		const run = store.getById("run-1");
		expect(run).toBeDefined();
		expect(run?.prompt).toBe("test prompt");
	});

	it("should list runs filtered by vertical", () => {
		store.record(sampleRun({ id: "r1", vertical: "drenyra" }));
		store.record(sampleRun({ id: "r2", vertical: "andino" }));
		const drenyraRuns = store.list("drenyra");
		expect(drenyraRuns).toHaveLength(1);
		expect(drenyraRuns[0]?.id).toBe("r1");
	});

	it("should list all runs when no filter", () => {
		store.record(sampleRun({ id: "r1", vertical: "drenyra" }));
		store.record(sampleRun({ id: "r2", vertical: "andino" }));
		expect(store.list()).toHaveLength(2);
	});

	it("should return defensive copies", () => {
		store.record(sampleRun());
		const run = store.getById("run-1")!;
		run.prompt = "hacked";
		const same = store.getById("run-1")!;
		expect(same.prompt).toBe("test prompt");
	});

	it("should compute stats", () => {
		store.record(
			sampleRun({
				id: "r1",
				vertical: "drenyra",
				tokensUsed: 100,
				durationMs: 500,
			}),
		);
		store.record(
			sampleRun({
				id: "r2",
				vertical: "drenyra",
				tokensUsed: 200,
				durationMs: 1500,
				approvalStatus: "approved",
			}),
		);
		store.record(
			sampleRun({
				id: "r3",
				vertical: "andino",
				tokensUsed: 50,
				durationMs: 300,
			}),
		);
		const stats = store.getStats();
		expect(stats.total).toBe(3);
		expect(stats.byVertical.drenyra).toBe(2);
		expect(stats.byVertical.andino).toBe(1);
		expect(stats.byStatus.auto).toBe(2);
		expect(stats.byStatus.approved).toBe(1);
		expect(stats.averageDurationMs).toBe(767);
		expect(stats.totalTokensUsed).toBe(350);
	});
});
