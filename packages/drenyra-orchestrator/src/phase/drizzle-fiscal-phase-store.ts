// ─── Drizzle-backed FiscalPhaseStore ──────────────────────────────
// Persists fiscal phase state per (RUC, periodo) tuple to PostgreSQL.
// Replaces InMemoryFiscalPhaseStore for production use.

import { db } from "@drenyra/persistence/client";
import { fiscalPhasePeriods } from "@drenyra/persistence/schema";
import { and, eq, inArray, not } from "drizzle-orm";
import type { FiscalPhaseStore } from "./fiscal-phase-store";
import type {
	FiscalPeriodState,
	FiscalPhaseId,
	GateResult,
	PhaseHistoryEntry,
	PhaseStatus,
} from "./types";

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Map a DB row to the FiscalPeriodState domain type.
 * The DB stores gateResults separately; FiscalPeriodState only carries
 * phaseHistory (which includes gateResults per entry). We reconstruct
 * createdAt from the row's timestamp.
 */
function rowToState(
	row: typeof fiscalPhasePeriods.$inferSelect,
): FiscalPeriodState {
	return {
		ruc: row.ruc,
		periodo: row.periodo,
		currentPhase: row.currentPhase as FiscalPhaseId,
		status: row.status as PhaseStatus,
		phaseHistory: row.phaseHistory as PhaseHistoryEntry[],
		metadata: row.metadata as Record<string, unknown>,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

/**
 * Extract gateResults from the phaseHistory for a specific phase.
 * Used internally to populate the gateResults JSON column.
 */
function _extractGateResultsForPhase(
	phaseHistory: PhaseHistoryEntry[],
	phaseId: FiscalPhaseId,
): GateResult[] {
	const entry = phaseHistory.find((e) => e.phaseId === phaseId);
	return entry?.gateResults ?? [];
}

/**
 * Build a gateResults lookup from all phase history entries.
 * Returns a map of phaseId -> GateResult[].
 */
function buildGateResultsMap(
	phaseHistory: PhaseHistoryEntry[],
): Record<string, GateResult[]> {
	const map: Record<string, GateResult[]> = {};
	for (const entry of phaseHistory) {
		map[entry.phaseId] = entry.gateResults;
	}
	return map;
}

// ─── Store Implementation ────────────────────────────────────────

/**
 * PostgreSQL-backed FiscalPhaseStore using Drizzle ORM.
 *
 * Thread-safe at the DB level (each query is atomic). Designed for
 * production use where state must survive process restarts.
 *
 * @example
 * ```ts
 * const store = new DrizzleFiscalPhaseStore();
 * const state = await store.getPeriodState("20123456789", "2026-06");
 * ```
 */
export class DrizzleFiscalPhaseStore implements FiscalPhaseStore {
	// ── Query Helpers ──────────────────────────────────────────────

	/**
	 * Build a WHERE clause for (ruc, periodo) lookup.
	 */
	private byRucPeriodo(ruc: string, periodo: string) {
		return and(
			eq(fiscalPhasePeriods.ruc, ruc),
			eq(fiscalPhasePeriods.periodo, periodo),
		);
	}

	/**
	 * Fetch a single row by (ruc, periodo) or return undefined.
	 */
	private async findRow(
		ruc: string,
		periodo: string,
	): Promise<typeof fiscalPhasePeriods.$inferSelect | undefined> {
		const rows = await db
			.select()
			.from(fiscalPhasePeriods)
			.where(this.byRucPeriodo(ruc, periodo))
			.limit(1);
		return rows[0];
	}

	// ── Public API ─────────────────────────────────────────────────

	async getPeriodState(
		ruc: string,
		periodo: string,
	): Promise<FiscalPeriodState | undefined> {
		const row = await this.findRow(ruc, periodo);
		return row ? rowToState(row) : undefined;
	}

	async upsertPeriodState(state: FiscalPeriodState): Promise<void> {
		const existing = await this.findRow(state.ruc, state.periodo);

		if (existing) {
			await db
				.update(fiscalPhasePeriods)
				.set({
					status: state.status,
					currentPhase: state.currentPhase,
					phaseHistory: state.phaseHistory as unknown as Array<unknown>,
					metadata: state.metadata as Record<string, unknown>,
					gateResults: buildGateResultsMap(
						state.phaseHistory,
					) as unknown as Record<string, Array<unknown>>,
					updatedAt: new Date(),
				})
				.where(this.byRucPeriodo(state.ruc, state.periodo));
		} else {
			await db.insert(fiscalPhasePeriods).values({
				ruc: state.ruc,
				periodo: state.periodo,
				status: state.status,
				currentPhase: state.currentPhase,
				phaseHistory: state.phaseHistory as unknown as Array<unknown>,
				metadata: state.metadata as Record<string, unknown>,
				gateResults: buildGateResultsMap(
					state.phaseHistory,
				) as unknown as Record<string, Array<unknown>>,
				isComplete: state.status === "completed",
				updatedAt: new Date(),
			});
		}
	}

	async updatePhaseStatus(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		status: PhaseStatus,
	): Promise<FiscalPeriodState | undefined> {
		const existing = await this.findRow(ruc, periodo);
		if (!existing) return undefined;

		const updated = { ...existing };
		updated.status = status;
		updated.currentPhase = phaseId;
		updated.updatedAt = new Date();

		await db
			.update(fiscalPhasePeriods)
			.set({
				status: status,
				currentPhase: phaseId,
				updatedAt: updated.updatedAt,
			})
			.where(this.byRucPeriodo(ruc, periodo));

		return rowToState(updated);
	}

	async addGateResult(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		gateResult: GateResult,
	): Promise<void> {
		const row = await this.findRow(ruc, periodo);
		if (!row) return;

		// Update the gateResults JSON blob for the given phase
		const currentGateResults = (row.gateResults ?? {}) as Record<
			string,
			GateResult[]
		>;
		const phaseResults = currentGateResults[phaseId] ?? [];
		const updatedGateResults: Record<string, GateResult[]> = {
			...currentGateResults,
			[phaseId]: [...phaseResults, gateResult],
		};

		// Also update the matching entry in phaseHistory if it exists
		const phaseHistory = (row.phaseHistory ?? []) as PhaseHistoryEntry[];
		const updatedPhaseHistory = phaseHistory.map((entry) => {
			if (entry.phaseId === phaseId) {
				return {
					...entry,
					gateResults: [...(entry.gateResults ?? []), gateResult],
				};
			}
			return entry;
		});

		await db
			.update(fiscalPhasePeriods)
			.set({
				gateResults: updatedGateResults as unknown as Record<
					string,
					Array<unknown>
				>,
				phaseHistory: updatedPhaseHistory as unknown as Array<unknown>,
				updatedAt: new Date(),
			})
			.where(this.byRucPeriodo(ruc, periodo));
	}

	async addPhaseHistoryEntry(
		ruc: string,
		periodo: string,
		entry: PhaseHistoryEntry,
	): Promise<void> {
		const row = await this.findRow(ruc, periodo);
		if (!row) return;

		const phaseHistory = (row.phaseHistory ?? []) as PhaseHistoryEntry[];
		const existingIndex = phaseHistory.findIndex(
			(e) => e.phaseId === entry.phaseId,
		);
		let updatedPhaseHistory: PhaseHistoryEntry[];

		if (existingIndex >= 0) {
			updatedPhaseHistory = [...phaseHistory];
			updatedPhaseHistory[existingIndex] = entry;
		} else {
			updatedPhaseHistory = [...phaseHistory, entry];
		}

		// Also sync gateResults from the entry
		const allGateResults = buildGateResultsMap(updatedPhaseHistory);

		await db
			.update(fiscalPhasePeriods)
			.set({
				phaseHistory: updatedPhaseHistory as unknown as Array<unknown>,
				gateResults: allGateResults as unknown as Record<
					string,
					Array<unknown>
				>,
				updatedAt: new Date(),
			})
			.where(this.byRucPeriodo(ruc, periodo));
	}

	async listPeriodsByStatus(
		ruc: string,
		status: PhaseStatus,
	): Promise<Array<{ periodo: string; currentPhase: FiscalPhaseId }>> {
		const rows = await db
			.select({
				periodo: fiscalPhasePeriods.periodo,
				currentPhase: fiscalPhasePeriods.currentPhase,
			})
			.from(fiscalPhasePeriods)
			.where(
				and(
					eq(fiscalPhasePeriods.ruc, ruc),
					eq(fiscalPhasePeriods.status, status),
				),
			);

		return rows.map((r) => ({
			periodo: r.periodo,
			currentPhase: r.currentPhase as FiscalPhaseId,
		}));
	}

	async listActivePeriods(): Promise<Array<{ ruc: string; periodo: string }>> {
		const terminal: PhaseStatus[] = ["completed", "failed"];

		const rows = await db
			.select({
				ruc: fiscalPhasePeriods.ruc,
				periodo: fiscalPhasePeriods.periodo,
			})
			.from(fiscalPhasePeriods)
			.where(and(not(inArray(fiscalPhasePeriods.status, terminal))));

		return rows;
	}
}
