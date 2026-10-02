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
			if (typeof result.data !== "object" || result.data === null) continue;
			for (const [key, value] of Object.entries(
				result.data as Record<string, unknown>,
			)) {
				if (!(key in data)) {
					data[key] = value;
					continue;
				}
				// Conflict detected — keep higher-confidence value
				conflicts.push(buildConflict(results, result, key, data[key], value));
				if (result.confidence > 0.85) {
					data[key] = value;
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

function buildConflict(
	results: Array<{ domainId: string; data: unknown }>,
	current: { domainId: string; confidence: number },
	field: string,
	kept: unknown,
	incoming: unknown,
): Conflict {
	const firstOwner = results.find(
		(r) => r.data && (r.data as Record<string, unknown>)[field] !== undefined,
	);
	return {
		between: [current.domainId, firstOwner?.domainId ?? "unknown"],
		field,
		values: [kept, incoming],
		resolvedBy:
			current.confidence > 0.8 ? current.domainId : "lower-confidence",
	};
}
