// ─── Fiscal Phase Store ────────────────────────────────────────────
// Persists phase state per (RUC, periodo) tuple.
// Interface-driven: current impl is in-memory, future can be Drizzle/Redis.

import type {
	FiscalPeriodState,
	FiscalPhaseId,
	GateResult,
	PhaseHistoryEntry,
	PhaseStatus,
} from "./types";

/**
 * Interface for fiscal phase state persistence.
 * One state per (RUC, periodo) tuple.
 */
export interface FiscalPhaseStore {
	/** Get full period state for a RUC + periodo. */
	getPeriodState(
		ruc: string,
		periodo: string,
	): Promise<FiscalPeriodState | undefined>;

	/** Create or update the full period state. */
	upsertPeriodState(state: FiscalPeriodState): Promise<void>;

	/** Update current phase and status for a period. */
	updatePhaseStatus(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		status: PhaseStatus,
	): Promise<FiscalPeriodState | undefined>;

	/** Add a gate result to the current phase's history. */
	addGateResult(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		gateResult: GateResult,
	): Promise<void>;

	/** Add a history entry for a completed phase. */
	addPhaseHistoryEntry(
		ruc: string,
		periodo: string,
		entry: PhaseHistoryEntry,
	): Promise<void>;

	/** List all periods that are in a given status for a RUC. */
	listPeriodsByStatus(
		ruc: string,
		status: PhaseStatus,
	): Promise<Array<{ periodo: string; currentPhase: FiscalPhaseId }>>;

	/** List all RUCs with active (in_progress) periods. */
	listActivePeriods(): Promise<Array<{ ruc: string; periodo: string }>>;
}

/**
 * In-memory implementation of FiscalPhaseStore.
 * Thread-safe for single-process use. Replace with DB-backed impl for production.
 */
export class InMemoryFiscalPhaseStore implements FiscalPhaseStore {
	private readonly states = new Map<string, FiscalPeriodState>();

	private key(ruc: string, periodo: string): string {
		return `${ruc}:${periodo}`;
	}

	async getPeriodState(
		ruc: string,
		periodo: string,
	): Promise<FiscalPeriodState | undefined> {
		return this.states.get(this.key(ruc, periodo));
	}

	async upsertPeriodState(state: FiscalPeriodState): Promise<void> {
		this.states.set(this.key(state.ruc, state.periodo), {
			...state,
			updatedAt: new Date(),
		});
	}

	async updatePhaseStatus(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		status: PhaseStatus,
	): Promise<FiscalPeriodState | undefined> {
		const state = this.states.get(this.key(ruc, periodo));
		if (!state) return undefined;

		const updated: FiscalPeriodState = {
			...state,
			currentPhase: phaseId,
			status,
			updatedAt: new Date(),
		};

		this.states.set(this.key(ruc, periodo), updated);
		return updated;
	}

	async addGateResult(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		gateResult: GateResult,
	): Promise<void> {
		const state = this.states.get(this.key(ruc, periodo));
		if (!state) return;

		const updatedHistory = state.phaseHistory.map((entry) => {
			if (entry.phaseId === phaseId) {
				return {
					...entry,
					gateResults: [...entry.gateResults, gateResult],
				};
			}
			return entry;
		});

		this.states.set(this.key(ruc, periodo), {
			...state,
			phaseHistory: updatedHistory,
			updatedAt: new Date(),
		});
	}

	async addPhaseHistoryEntry(
		ruc: string,
		periodo: string,
		entry: PhaseHistoryEntry,
	): Promise<void> {
		const state = this.states.get(this.key(ruc, periodo));
		if (!state) return;

		const existingIndex = state.phaseHistory.findIndex(
			(e) => e.phaseId === entry.phaseId,
		);
		let updatedHistory: PhaseHistoryEntry[];

		if (existingIndex >= 0) {
			updatedHistory = [...state.phaseHistory];
			updatedHistory[existingIndex] = entry;
		} else {
			updatedHistory = [...state.phaseHistory, entry];
		}

		this.states.set(this.key(ruc, periodo), {
			...state,
			phaseHistory: updatedHistory,
			updatedAt: new Date(),
		});
	}

	async listPeriodsByStatus(
		ruc: string,
		status: PhaseStatus,
	): Promise<Array<{ periodo: string; currentPhase: FiscalPhaseId }>> {
		const results: Array<{ periodo: string; currentPhase: FiscalPhaseId }> = [];
		for (const [k, state] of this.states) {
			if (k.startsWith(`${ruc}:`) && state.status === status) {
				results.push({
					periodo: state.periodo,
					currentPhase: state.currentPhase,
				});
			}
		}
		return results;
	}

	async listActivePeriods(): Promise<Array<{ ruc: string; periodo: string }>> {
		const results: Array<{ ruc: string; periodo: string }> = [];
		const terminal: PhaseStatus[] = ["completed", "failed"];
		for (const state of this.states.values()) {
			if (!terminal.includes(state.status)) {
				results.push({ ruc: state.ruc, periodo: state.periodo });
			}
		}
		return results;
	}
}
