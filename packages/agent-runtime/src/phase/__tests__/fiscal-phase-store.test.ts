import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import type { FiscalPeriodState } from "../types";

function createSamplePeriodState(
	overrides: Partial<FiscalPeriodState> = {},
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "captura",
		status: "in_progress",
		phaseHistory: [],
		metadata: {},
		createdAt: new Date("2026-06-01"),
		updatedAt: new Date("2026-06-01"),
		...overrides,
	};
}

describe("InMemoryFiscalPhaseStore", () => {
	let store: InMemoryFiscalPhaseStore;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
	});

	describe("getPeriodState / upsertPeriodState", () => {
		it("returns undefined for a non-existent period", async () => {
			const state = await store.getPeriodState("123", "2026-01");
			expect(state).toBeUndefined();
		});

		it("stores and retrieves a period state", async () => {
			const state = createSamplePeriodState();
			await store.upsertPeriodState(state);

			const retrieved = await store.getPeriodState("20123456789", "2026-06");
			expect(retrieved).toBeDefined();
			expect(retrieved?.ruc).toBe("20123456789");
			expect(retrieved?.periodo).toBe("2026-06");
			expect(retrieved?.currentPhase).toBe("captura");
		});

		it("updates the updatedAt timestamp on upsert", async () => {
			const state = createSamplePeriodState();
			await store.upsertPeriodState(state);

			const oldUpdated = (await store.getPeriodState("20123456789", "2026-06"))
				?.updatedAt;

			await store.upsertPeriodState({ ...state, metadata: { updated: true } });

			const newUpdated = (await store.getPeriodState("20123456789", "2026-06"))
				?.updatedAt;
			expect(newUpdated.getTime()).toBeGreaterThanOrEqual(oldUpdated.getTime());
		});
	});

	describe("updatePhaseStatus", () => {
		it("updates the current phase and status", async () => {
			const state = createSamplePeriodState();
			await store.upsertPeriodState(state);

			await store.updatePhaseStatus(
				"20123456789",
				"2026-06",
				"clasificacion",
				"in_progress",
			);

			const updated = await store.getPeriodState("20123456789", "2026-06");
			expect(updated?.currentPhase).toBe("clasificacion");
			expect(updated?.status).toBe("in_progress");
		});

		it("returns undefined for non-existent period", async () => {
			const result = await store.updatePhaseStatus(
				"999",
				"2026-01",
				"captura",
				"in_progress",
			);
			expect(result).toBeUndefined();
		});
	});

	describe("addGateResult", () => {
		it("adds a gate result to an existing phase history entry", async () => {
			const state = createSamplePeriodState({
				phaseHistory: [
					{
						phaseId: "captura",
						status: "in_progress",
						startedAt: new Date(),
						gateResults: [],
					},
				],
			});
			await store.upsertPeriodState(state);

			await store.addGateResult("20123456789", "2026-06", "captura", {
				gateId: "periodo-open",
				gateName: "Periodo Open",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			});

			const updated = await store.getPeriodState("20123456789", "2026-06");
			const capturaEntry = updated?.phaseHistory.find(
				(e) => e.phaseId === "captura",
			);
			expect(capturaEntry?.gateResults).toHaveLength(1);
			expect(capturaEntry?.gateResults[0].gateId).toBe("periodo-open");
		});
	});

	describe("addPhaseHistoryEntry", () => {
		it("adds a new history entry", async () => {
			const state = createSamplePeriodState();
			await store.upsertPeriodState(state);

			await store.addPhaseHistoryEntry("20123456789", "2026-06", {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				gateResults: [],
				agentOutput: { done: true },
			});

			const updated = await store.getPeriodState("20123456789", "2026-06");
			expect(updated?.phaseHistory).toHaveLength(1);
			expect(updated?.phaseHistory[0].phaseId).toBe("captura");
			expect(updated?.phaseHistory[0].agentOutput).toEqual({ done: true });
		});

		it("updates an existing entry with the same phaseId", async () => {
			const state = createSamplePeriodState({
				phaseHistory: [
					{
						phaseId: "captura",
						status: "in_progress",
						startedAt: new Date(),
						gateResults: [],
					},
				],
			});
			await store.upsertPeriodState(state);

			await store.addPhaseHistoryEntry("20123456789", "2026-06", {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				gateResults: [],
			});

			const updated = await store.getPeriodState("20123456789", "2026-06");
			expect(updated?.phaseHistory).toHaveLength(1); // Updated, not appended
			expect(updated?.phaseHistory[0].status).toBe("completed");
		});
	});

	describe("listPeriodsByStatus", () => {
		it("lists periods matching a status for a given RUC", async () => {
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "A",
					periodo: "2026-01",
					status: "in_progress",
				}),
			);
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "A",
					periodo: "2026-02",
					status: "completed",
				}),
			);
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "B",
					periodo: "2026-01",
					status: "in_progress",
				}),
			);

			const activeA = await store.listPeriodsByStatus("A", "in_progress");
			expect(activeA).toHaveLength(1);
			expect(activeA[0].periodo).toBe("2026-01");
		});
	});

	describe("listActivePeriods", () => {
		it("lists all in_progress periods across RUCs", async () => {
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "A",
					periodo: "2026-01",
					status: "in_progress",
				}),
			);
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "B",
					periodo: "2026-01",
					status: "in_progress",
				}),
			);
			await store.upsertPeriodState(
				createSamplePeriodState({
					ruc: "C",
					periodo: "2026-01",
					status: "completed",
				}),
			);

			const active = await store.listActivePeriods();
			expect(active).toHaveLength(2);
			expect(active.map((a) => a.ruc).sort()).toEqual(["A", "B"]);
		});
	});
});
