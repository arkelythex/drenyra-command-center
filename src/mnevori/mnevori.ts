/**
 * Mnevori — core persistence module.
 *
 * Accepts a FiscalPhaseStore via dependency injection so the module
 * stays framework-free (no direct orchestration package imports).
 */

import type { FiscalPhaseStore } from "../phase/fiscal-phase-store";
import type { FiscalPhaseId } from "../phase/types";
import type {
	MnevoriArtifact,
	MnevoriPhaseSnapshot,
	MnevoriResumePoint,
	RegulationVersion,
} from "./types";

const CURRENT_REGULATION_VERSION = "2026.1";

export class Mnevori {
	private readonly store: FiscalPhaseStore;

	constructor(store: FiscalPhaseStore) {
		this.store = store;
	}

	/**
	 * Persist a phase artifact — call BEFORE exit gate evaluation.
	 */
	async persistArtifact(
		artifact: Omit<MnevoriArtifact, "id" | "persistedAt">,
	): Promise<string> {
		const id = `mnevori:${artifact.ruc}:${artifact.periodo}:${artifact.phaseId}:${Date.now()}`;
		const full: MnevoriArtifact = {
			...artifact,
			id,
			persistedAt: new Date().toISOString(),
		};

		const state = await this.store.getPeriodState(
			artifact.ruc,
			artifact.periodo,
		);
		if (!state)
			throw new Error(
				`Period ${artifact.periodo} for RUC ${artifact.ruc} not found`,
			);

		const mnevoriArtifacts = (state.metadata?._mnevori ?? {}) as Record<
			string,
			unknown
		>;
		const phaseArtifacts = (mnevoriArtifacts[artifact.phaseId] ??
			[]) as MnevoriArtifact[];
		phaseArtifacts.push(full);
		mnevoriArtifacts[artifact.phaseId] = phaseArtifacts;

		await this.store.upsertPeriodState({
			...state,
			metadata: {
				...state.metadata,
				_mnevori: mnevoriArtifacts,
			},
		});

		return id;
	}

	/**
	 * Persist a full phase snapshot (agent output + gate results).
	 */
	async persistPhaseSnapshot(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		snapshot: Omit<
			MnevoriPhaseSnapshot,
			"ruc" | "periodo" | "phaseId" | "persistedAt"
		>,
	): Promise<string> {
		return this.persistArtifact({
			ruc,
			periodo,
			phaseId,
			type: "phase_snapshot",
			payload: {
				status: snapshot.status,
				agentOutput: snapshot.agentOutput,
				gateResults: snapshot.gateResults,
			},
			version: 1,
			tier: "T2_STRONG",
		});
	}

	/**
	 * Find the last persisted phase for a (ruc, periodo) — for resume.
	 */
	async getResumePoint(
		ruc: string,
		periodo: string,
	): Promise<MnevoriResumePoint | null> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) return null;

		const phases = state.phaseHistory;
		if (phases.length === 0) return null;

		const last = phases[phases.length - 1];

		return {
			ruc,
			periodo,
			lastPhaseId: last.phaseId,
			lastStatus: last.status as MnevoriResumePoint["lastStatus"],
			regulationVersion: this.getRegulationVersion(),
			lastPersistedAt:
				last.completedAt?.toISOString() ?? last.startedAt.toISOString(),
		};
	}

	/**
	 * List all phase snapshots for a (ruc, periodo).
	 */
	async listPhaseSnapshots(
		ruc: string,
		periodo: string,
	): Promise<MnevoriArtifact[]> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) return [];

		const mnevoriArtifacts = (state.metadata?._mnevori ?? {}) as Record<
			string,
			unknown
		>;
		const all: MnevoriArtifact[] = [];
		for (const phaseId of Object.keys(mnevoriArtifacts)) {
			const artifacts = mnevoriArtifacts[phaseId] as MnevoriArtifact[];
			all.push(...artifacts);
		}
		return all.sort(
			(a, b) =>
				new Date(b.persistedAt).getTime() - new Date(a.persistedAt).getTime(),
		);
	}

	/**
	 * Get the current regulation version.
	 * Can be overridden for testing or dynamic regulation updates.
	 */
	getRegulationVersion(): string {
		return CURRENT_REGULATION_VERSION;
	}

	/**
	 * Check if a phase's regulation version matches the current one.
	 * If not, the cached phase result should be flagged for re-validation.
	 */
	isRegulationCurrent(phaseVersion: string): boolean {
		return phaseVersion === CURRENT_REGULATION_VERSION;
	}
}
