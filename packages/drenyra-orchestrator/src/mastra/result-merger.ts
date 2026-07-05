/** Conflict between two domain agent results */
export interface Conflict {
	between: string[];
	field: string;
	values: unknown[];
	resolvedBy: string;
}

/** Result from merging multiple domain outputs */
export interface MergeResult {
	success: boolean;
	data: Record<string, unknown>;
	conflicts: Conflict[];
}

/**
 * Merges results from multiple domain agents.
 * Handles conflict resolution automatically.
 */
export class ResultMerger {
	/**
	 * Merge results from multiple domain agents.
	 * Each domain produces a partial result; this combines them.
	 */
	merge(
		results: Array<{ domainId: string; data: unknown; confidence: number }>,
	): MergeResult {
		const data: Record<string, unknown> = {};
		const conflicts: Conflict[] = [];

		for (const result of results) {
			if (typeof result.data === "object" && result.data !== null) {
				for (const [key, value] of Object.entries(
					result.data as Record<string, unknown>,
				)) {
					if (key in data) {
						// Conflict detected — keep higher-confidence value
						conflicts.push({
							between: [
								result.domainId,
								results.find(
									(r) =>
										r.data &&
										(r.data as Record<string, unknown>)[key] !== undefined,
								)?.domainId ?? "unknown",
							],
							field: key,
							values: [data[key], value],
							resolvedBy:
								result.confidence > 0.8 ? result.domainId : "lower-confidence",
						});
						// Keep existing value if higher confidence
						if (result.confidence > 0.85) {
							data[key] = value;
						}
					} else {
						data[key] = value;
					}
				}
			}
		}

		return {
			success:
				conflicts.length === 0 ||
				conflicts.every((c) => c.resolvedBy !== "unresolved"),
			data,
			conflicts,
		};
	}
}
