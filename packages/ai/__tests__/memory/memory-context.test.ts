import { describe, expect, it, vi } from "vitest";
import { MemoryContextProvider } from "../../src/memory/memory-context";
import type { AgentRunState, SessionStore } from "../../src/session";

function createMockStore(runs: Partial<AgentRunState>[] = []): SessionStore {
	return {
		saveRunState: vi.fn(),
		getRunState: vi.fn(),
		listRunStates: vi.fn().mockResolvedValue(runs),
		appendEvent: vi.fn(),
		getEvents: vi.fn(),
		updateRunState: vi.fn(),
		recoverRunState: vi.fn(),
		saveInput: vi.fn(),
		getInput: vi.fn(),
	} as unknown as SessionStore;
}

function makeRun(overrides: Partial<AgentRunState> = {}): AgentRunState {
	return {
		id: "run-1",
		runId: "550e8400-e29b-41d4-a716-446655440000",
		sessionId: null,
		workflowState: "COMPLETED",
		agentMetrics: null,
		context: {
			inputType: "invoice_image",
			memorySummary:
				"Extracted invoice: EMPRESA SAC - RUC: 20123456789 - Amount: PEN 118.00 - Confidence: 95% - Flags: 0",
		},
		status: "completed",
		error: null,
		companyId: "ruc-20123456789",
		startedAt: new Date("2026-06-15T10:00:00Z"),
		completedAt: new Date("2026-06-15T10:01:30Z"),
		createdAt: new Date("2026-06-15T10:00:00Z"),
		updatedAt: new Date("2026-06-15T10:01:30Z"),
		...overrides,
	};
}

describe("MemoryContextProvider", () => {
	describe("getContext", () => {
		it("returns formatted context when past completed runs exist", async () => {
			const mockStore = createMockStore([makeRun()]);
			const provider = new MemoryContextProvider(mockStore);

			const result = await provider.getContext("ruc-20123456789");

			expect(result).not.toBeNull();
			expect(result!.recentRuns).toBe(1);
			expect(result!.companyId).toBe("ruc-20123456789");
			expect(result!.summary).toContain("[Past Run 1]");
			expect(result!.summary).toContain("EMPRESA SAC");
			expect(result!.summary).toContain("PEN 118.00");
			expect(mockStore.listRunStates).toHaveBeenCalledWith({
				companyId: "ruc-20123456789",
				status: "completed",
				limit: 5,
			});
		});

		it("returns null when no past runs exist", async () => {
			const mockStore = createMockStore([]);
			const provider = new MemoryContextProvider(mockStore);

			const result = await provider.getContext("ruc-20123456789");

			expect(result).toBeNull();
		});

		it("returns null when store is not configured (null/undefined)", async () => {
			const store = null as unknown as SessionStore;
			const provider = new MemoryContextProvider(store);
			await expect(provider.getContext("ruc-20123456789")).rejects.toThrow();
		});

		it("respects custom maxRuns config", async () => {
			const runs = Array.from({ length: 10 }, (_, i) =>
				makeRun({ runId: `run-${i}` }),
			);
			const mockStore = createMockStore(runs);
			const provider = new MemoryContextProvider(mockStore, {
				maxRuns: 3,
				maxSummaryLength: 500,
			});

			await provider.getContext("ruc-test");

			expect(mockStore.listRunStates).toHaveBeenCalledWith({
				companyId: "ruc-test",
				status: "completed",
				limit: 3,
			});
		});

		it("truncates long summaries", async () => {
			const longSummary = "A".repeat(1000);
			const mockStore = createMockStore([
				makeRun({
					context: { memorySummary: longSummary, inputType: "invoice_image" },
				}),
			]);
			const provider = new MemoryContextProvider(mockStore, {
				maxRuns: 5,
				maxSummaryLength: 100,
			});

			const result = await provider.getContext("ruc-test");

			expect(result!.summary.length).toBeLessThan(150); // "[Past Run 1]\n" + 100 chars + "..."
			expect(result!.summary).toContain("...");
		});

		it("handles runs without memorySummary by using fallback", async () => {
			const mockStore = createMockStore([
				makeRun({
					context: { inputType: "invoice_image" },
					workflowState: "EXTRACTING",
					completedAt: new Date("2026-06-15T10:01:00Z"),
				}),
			]);
			const provider = new MemoryContextProvider(mockStore);

			const result = await provider.getContext("ruc-test");

			expect(result).not.toBeNull();
			expect(result!.summary).toContain("invoice_image");
			expect(result!.summary).toContain("EXTRACTING");
		});

		it("handles null context gracefully", async () => {
			const mockStore = createMockStore([makeRun({ context: null })]);
			const provider = new MemoryContextProvider(mockStore);

			const result = await provider.getContext("ruc-test");

			expect(result).not.toBeNull();
			expect(result!.summary).toContain("unknown");
		});

		it("non-blocking when store throws", async () => {
			const mockStore = createMockStore();
			(mockStore.listRunStates as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("DB connection lost"),
			);
			const provider = new MemoryContextProvider(mockStore);

			await expect(provider.getContext("ruc-test")).rejects.toThrow(
				"DB connection lost",
			);
		});

		it("returns multiple runs in order", async () => {
			const runs = [
				makeRun({
					runId: "run-1",
					context: {
						memorySummary: "First extraction result",
						inputType: "invoice_image",
					},
				}),
				makeRun({
					runId: "run-2",
					context: {
						memorySummary: "Second extraction result",
						inputType: "invoice_xml",
					},
				}),
			];
			const mockStore = createMockStore(runs);
			const provider = new MemoryContextProvider(mockStore);

			const result = await provider.getContext("ruc-test");

			expect(result!.recentRuns).toBe(2);
			expect(result!.summary).toContain("[Past Run 1]");
			expect(result!.summary).toContain("[Past Run 2]");
			expect(result!.summary).toContain("First extraction");
			expect(result!.summary).toContain("Second extraction");
		});
	});
});
