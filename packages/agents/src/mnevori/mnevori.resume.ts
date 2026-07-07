/**
 * MnevoriResumeService — finds and resumes interrupted fiscal periods.
 */

import type { FiscalPhaseStore } from "../phase/fiscal-phase-store";
import type { MnevoriResumePoint } from "./types";
import type { Mnevori } from "../mnevori";

const PHASE_SEQUENCE = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
	"auditoria",
] as const;

export class MnevoriResumeService {
	private readonly mnevori: Mnevori;
	private readonly store: FiscalPhaseStore;

	constructor(mnevori: Mnevori, store: FiscalPhaseStore) {
		this.mnevori = mnevori;
		this.store = store;
	}

	async findInterruptedPeriods(): Promise<MnevoriResumePoint[]> {
		const active = await this.store.listActivePeriods();
		const points: MnevoriResumePoint[] = [];

		for (const { ruc, periodo } of active) {
			const point = await this.mnevori.getResumePoint(ruc, periodo);
			if (point) points.push(point);
		}

		return points;
	}

	getPhaseToResume(point: MnevoriResumePoint): string | null {
		if (point.lastStatus === "completed") {
			const idx = PHASE_SEQUENCE.indexOf(
				point.lastPhaseId as (typeof PHASE_SEQUENCE)[number],
			);
			if (idx === -1 || idx >= PHASE_SEQUENCE.length - 1) return null;
			return PHASE_SEQUENCE[idx + 1];
		}

		if (point.lastStatus === "blocked" || point.lastStatus === "in_progress") {
			return point.lastPhaseId;
		}

		return null;
	}
}
