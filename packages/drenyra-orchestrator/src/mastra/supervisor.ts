import type { Conflict } from "./result-merger";

/** Timing information for each phase */
export interface PhaseTiming {
	domain: string;
	startedAt: Date;
	completedAt: Date;
	durationMs: number;
}

/** The orchestrator execution mode */
export type SwarmMode = "flat" | "hierarchy";

/**
 * Supervises the overall workflow execution.
 * Resolves conflicts, manages escalations, and tracks timing.
 */
export class Supervisor {
	private readonly timings: PhaseTiming[] = [];

	/**
	 * Resolve conflicts between domain agents.
	 * Uses configurable resolution strategies.
	 */
	resolveConflicts(
		conflicts: Conflict[],
		strategy: "highest-confidence" | "majority" | "latest" = "highest-confidence",
	): Conflict[] {
		return conflicts.map((conflict) => {
			switch (strategy) {
				case "highest-confidence": {
					return {
						...conflict,
						resolvedBy: conflict.resolvedBy,
					};
				}
				case "latest": {
					return {
						...conflict,
						resolvedBy: "latest-timestamp",
					};
				}
				default: {
					return {
						...conflict,
						resolvedBy: "default-strategy",
					};
				}
			}
		});
	}

	/**
	 * Determine if the workflow can proceed given current results.
	 */
	canProceed(
		results: Array<{ domainId: string; status: string }>,
	): { proceed: boolean; reason?: string } {
		const failures = results.filter((r) => r.status === "error" || r.status === "timeout");

		if (failures.length > results.length / 2) {
			return {
				proceed: false,
				reason: `Too many failures: ${failures.length}/${results.length} domains failed`,
			};
		}

		return { proceed: true };
	}

	/**
	 * Track execution timing for a domain.
	 */
	recordTiming(domain: string, startedAt: Date, completedAt: Date): void {
		this.timings.push({
			domain,
			startedAt,
			completedAt,
			durationMs: completedAt.getTime() - startedAt.getTime(),
		});
	}

	/**
	 * Get all recorded timings.
	 */
	getTimings(): PhaseTiming[] {
		return [...this.timings];
	}

	/**
	 * Get performance summary.
	 */
	getPerformanceSummary(): {
		totalDurationMs: number;
		totalPhases: number;
		slowest: PhaseTiming | undefined;
		fastest: PhaseTiming | undefined;
	} {
		const sorted = [...this.timings].sort((a, b) => b.durationMs - a.durationMs);

		return {
			totalDurationMs: this.timings.reduce((sum, t) => sum + t.durationMs, 0),
			totalPhases: this.timings.length,
			slowest: sorted[0],
			fastest: sorted[sorted.length - 1],
		};
	}
}
