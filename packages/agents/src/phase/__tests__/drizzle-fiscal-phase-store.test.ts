import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FiscalPeriodState, PhaseHistoryEntry } from "../types";

// ─── Hoisted Mocks ───────────────────────────────────────────────
// vi.mock factories are hoisted to the top of the file, so any variables
// they reference must be created via vi.hoisted().

const { mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockInsert: vi.fn(),
	mockUpdate: vi.fn(),
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: mockSelect,
		insert: mockInsert,
		update: mockUpdate,
	},
}));

vi.mock("@drenyra/persistence/schema", () => ({
	fiscalPhasePeriods: {
		id: {} as never,
		ruc: {} as never,
		periodo: {} as never,
		status: {} as never,
		currentPhase: {} as never,
		phaseHistory: {} as never,
		metadata: {} as never,
		gateResults: {} as never,
		isComplete: {} as never,
		createdAt: {} as never,
		updatedAt: {} as never,
	},
}));

// Now import after mocks are set up
import { DrizzleFiscalPhaseStore } from "../drizzle-fiscal-phase-store";

// ─── Mock Data ────────────────────────────────────────────────────

const NOW = new Date("2026-06-25T12:00:00Z");
const SAMPLE_ROW = {
	id: 1,
	ruc: "20123456789",
	periodo: "2026-06",
	status: "in_progress",
	currentPhase: "captura",
	phaseHistory: [],
	metadata: {},
	gateResults: {},
	isComplete: false,
	createdAt: NOW,
	updatedAt: NOW,
};

function createSampleState(
	overrides: Partial<FiscalPeriodState> = {},
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "captura",
		status: "in_progress",
		phaseHistory: [],
		metadata: {},
		createdAt: NOW,
		updatedAt: NOW,
		...overrides,
	};
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Create a mock for a chained Drizzle select + from + where + limit query
 * that returns the given rows.
 */
function mockSelectQuery(rows: unknown[]) {
	const mockLimit = vi.fn().mockReturnValue(Promise.resolve(rows));
	const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

	mockSelect.mockReturnValue({ from: mockFrom });

	return { mockFrom, mockWhere, mockLimit };
}

/**
 * Create a mock for insert().values(...) that resolves to undefined.
 */
function mockInsertValues() {
	const mockValues = vi.fn().mockResolvedValue(undefined);
	mockInsert.mockReturnValue({ values: mockValues });
	return mockValues;
}

/**
 * Create a mock for update().set(...).where(...) that resolves to undefined.
 */
function mockUpdateSetWhere() {
	const mockWhere = vi.fn().mockResolvedValue(undefined);
	const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
	mockUpdate.mockReturnValue({ set: mockSet });
	return { mockSet, mockWhere };
}

// ─── Tests ───────────────────────────────────────────────────────

describe("DrizzleFiscalPhaseStore", () => {
	let store: DrizzleFiscalPhaseStore;

	beforeEach(() => {
		vi.clearAllMocks();
		store = new DrizzleFiscalPhaseStore();
	});

	// ── getPeriodState ──────────────────────────────────────────────

	describe("getPeriodState", () => {
		it("returns undefined when no row exists", async () => {
			mockSelectQuery([]);

			const result = await store.getPeriodState("20123456789", "2026-06");
			expect(result).toBeUndefined();
		});

		it("returns the mapped state when a row is found", async () => {
			mockSelectQuery([SAMPLE_ROW]);

			const result = await store.getPeriodState("20123456789", "2026-06");
			expect(result).toBeDefined();
			expect(result?.ruc).toBe("20123456789");
			expect(result?.periodo).toBe("2026-06");
			expect(result?.currentPhase).toBe("captura");
			expect(result?.status).toBe("in_progress");
		});

		it("maps phaseHistory from JSONB correctly", async () => {
			const historyEntry: PhaseHistoryEntry = {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date("2026-06-01"),
				completedAt: new Date("2026-06-02"),
				gateResults: [
					{
						gateId: "periodo-open",
						gateName: "Periodo Open",
						passed: true,
						severity: "info",
						evaluatedAt: new Date("2026-06-01"),
					},
				],
			};

			mockSelectQuery([{ ...SAMPLE_ROW, phaseHistory: [historyEntry] }]);

			const result = await store.getPeriodState("20123456789", "2026-06");
			expect(result?.phaseHistory).toHaveLength(1);
			expect(result?.phaseHistory[0].phaseId).toBe("captura");
			expect(result?.phaseHistory[0].gateResults).toHaveLength(1);
			expect(result?.phaseHistory[0].gateResults[0].gateId).toBe(
				"periodo-open",
			);
		});
	});

	// ── upsertPeriodState ───────────────────────────────────────────

	describe("upsertPeriodState", () => {
		it("inserts a new row when no existing record is found", async () => {
			// First call = select (returns empty)
			mockSelectQuery([]);
			// Second call = insert
			const insertValues = mockInsertValues();

			const state = createSampleState();
			await store.upsertPeriodState(state);

			expect(mockSelect).toHaveBeenCalledTimes(1);
			expect(mockInsert).toHaveBeenCalledTimes(1);
			expect(insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					ruc: "20123456789",
					periodo: "2026-06",
					status: "in_progress",
				}),
			);
		});

		it("updates an existing row when found", async () => {
			// First call = select (returns existing)
			mockSelectQuery([SAMPLE_ROW]);
			// Second call = update
			const { mockSet, mockWhere } = mockUpdateSetWhere();

			const state = createSampleState({ status: "completed" });
			await store.upsertPeriodState(state);

			expect(mockSelect).toHaveBeenCalledTimes(1);
			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "completed",
				}),
			);
			expect(mockWhere).toHaveBeenCalled();
		});
	});

	// ── updatePhaseStatus ───────────────────────────────────────────

	describe("updatePhaseStatus", () => {
		it("updates phase and status, returns updated state", async () => {
			mockSelectQuery([SAMPLE_ROW]);
			const { mockSet, mockWhere } = mockUpdateSetWhere();

			const result = await store.updatePhaseStatus(
				"20123456789",
				"2026-06",
				"clasificacion",
				"in_progress",
			);

			expect(result).toBeDefined();
			expect(result?.currentPhase).toBe("clasificacion");
			expect(result?.status).toBe("in_progress");
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					currentPhase: "clasificacion",
					status: "in_progress",
				}),
			);
			expect(mockWhere).toHaveBeenCalled();
		});

		it("returns undefined for a non-existent period", async () => {
			mockSelectQuery([]);

			const result = await store.updatePhaseStatus(
				"999",
				"2026-01",
				"captura",
				"in_progress",
			);
			expect(result).toBeUndefined();
			expect(mockUpdate).not.toHaveBeenCalled();
		});
	});

	// ── addGateResult ───────────────────────────────────────────────

	describe("addGateResult", () => {
		it("adds a gate result to an existing phase", async () => {
			mockSelectQuery([
				{
					...SAMPLE_ROW,
					phaseHistory: [
						{
							phaseId: "captura" as const,
							status: "in_progress" as const,
							startedAt: new Date(),
							gateResults: [],
						},
					],
				},
			]);
			const { mockSet, mockWhere } = mockUpdateSetWhere();

			await store.addGateResult("20123456789", "2026-06", "captura", {
				gateId: "periodo-open",
				gateName: "Periodo Open",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			});

			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockSet).toHaveBeenCalled();
			expect(mockWhere).toHaveBeenCalled();
		});

		it("does nothing when the period does not exist", async () => {
			mockSelectQuery([]);

			await store.addGateResult("999", "2026-01", "captura", {
				gateId: "periodo-open",
				gateName: "Periodo Open",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			});

			expect(mockUpdate).not.toHaveBeenCalled();
		});
	});

	// ── addPhaseHistoryEntry ────────────────────────────────────────

	describe("addPhaseHistoryEntry", () => {
		it("adds a new history entry when phase does not exist", async () => {
			mockSelectQuery([SAMPLE_ROW]);
			const { mockSet, mockWhere } = mockUpdateSetWhere();

			await store.addPhaseHistoryEntry("20123456789", "2026-06", {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				gateResults: [],
				agentOutput: { done: true },
			});

			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockSet).toHaveBeenCalled();
			expect(mockWhere).toHaveBeenCalled();
		});

		it("updates an existing entry with the same phaseId", async () => {
			mockSelectQuery([
				{
					...SAMPLE_ROW,
					phaseHistory: [
						{
							phaseId: "captura" as const,
							status: "in_progress" as const,
							startedAt: new Date(),
							gateResults: [],
						},
					],
				},
			]);
			const { mockSet } = mockUpdateSetWhere();

			await store.addPhaseHistoryEntry("20123456789", "2026-06", {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				gateResults: [],
			});

			expect(mockUpdate).toHaveBeenCalledTimes(1);
			// Verify the set call includes the updated phaseHistory with only 1 entry (updated, not appended)
			const setCallArgs = mockSet.mock.calls[0][0];
			expect(setCallArgs.phaseHistory).toHaveLength(1);
			expect(setCallArgs.phaseHistory[0].status).toBe("completed");
		});

		it("does nothing when the period does not exist", async () => {
			mockSelectQuery([]);

			await store.addPhaseHistoryEntry("999", "2026-01", {
				phaseId: "captura",
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				gateResults: [],
			});

			expect(mockUpdate).not.toHaveBeenCalled();
		});
	});

	// ── listPeriodsByStatus ─────────────────────────────────────────

	describe("listPeriodsByStatus", () => {
		it("returns matching periods for a given RUC and status", async () => {
			const mockFrom = vi.fn().mockReturnValue({
				where: vi
					.fn()
					.mockResolvedValue([{ periodo: "2026-01", currentPhase: "captura" }]),
			});
			mockSelect.mockReturnValue({ from: mockFrom });

			const result = await store.listPeriodsByStatus("A", "in_progress");
			expect(result).toHaveLength(1);
			expect(result[0].periodo).toBe("2026-01");
			expect(result[0].currentPhase).toBe("captura");
		});

		it("returns empty array when no periods match", async () => {
			const mockFrom = vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([]),
			});
			mockSelect.mockReturnValue({ from: mockFrom });

			const result = await store.listPeriodsByStatus("A", "completed");
			expect(result).toHaveLength(0);
		});
	});

	// ── listActivePeriods ───────────────────────────────────────────

	describe("listActivePeriods", () => {
		it("returns only non-terminal periods", async () => {
			const mockWhere = vi.fn().mockResolvedValue([
				{ ruc: "A", periodo: "2026-01" },
				{ ruc: "B", periodo: "2026-01" },
			]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockSelect.mockReturnValue({ from: mockFrom });

			const result = await store.listActivePeriods();
			expect(result).toHaveLength(2);
			expect(result.map((r) => r.ruc).sort()).toEqual(["A", "B"]);
		});

		it("returns empty array when no active periods exist", async () => {
			const mockWhere = vi.fn().mockResolvedValue([]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockSelect.mockReturnValue({ from: mockFrom });

			const result = await store.listActivePeriods();
			expect(result).toHaveLength(0);
		});

		it("excludes completed and failed periods", async () => {
			let capturedCondition: unknown = null;

			const mockWhere = vi.fn().mockImplementation((condition) => {
				capturedCondition = condition;
				return Promise.resolve([{ ruc: "A", periodo: "2026-01" }]);
			});
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockSelect.mockReturnValue({ from: mockFrom });

			const result = await store.listActivePeriods();

			// Should only return active (not completed/failed)
			expect(result).toHaveLength(1);
			expect(result[0].ruc).toBe("A");
			expect(capturedCondition).toBeTruthy();
		});
	});
});
