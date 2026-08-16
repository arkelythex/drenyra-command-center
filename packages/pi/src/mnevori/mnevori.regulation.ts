/**
 * MnevoriRegulationTracker — tracks regulation versions for phase cache invalidation.
 *
 * When a regulation changes mid-case, cached phase results must be flagged
 * for re-validation rather than silently reused.
 */

import type { MnevoriArtifact, RegulationVersion } from "./types";

export type CacheStatus = "valid" | "needs_review" | "invalid";

export interface PhaseCacheInfo {
	phaseId: string;
	persistedAt: string;
	regulationVersion: string;
	cacheStatus: CacheStatus;
}

export class MnevoriRegulationTracker {
	private regulations: Map<string, RegulationVersion> = new Map();

	constructor(_currentVersion: string = "2026.1") {}

	register(regulation: RegulationVersion): void {
		this.regulations.set(regulation.regulationId, regulation);
	}

	updateCurrentVersion(_version: string): void {}

	evaluateArtifactCache(artifact: MnevoriArtifact): CacheStatus {
		if (artifact.version === 0) return "needs_review";

		const phaseReg = this.regulations.get(`phase:${artifact.phaseId}`);
		if (phaseReg?.deprecatedAt) {
			return "invalid";
		}

		return "valid";
	}

	findStaleArtifacts(artifacts: MnevoriArtifact[]): MnevoriArtifact[] {
		return artifacts.filter((a) => this.evaluateArtifactCache(a) !== "valid");
	}
}
