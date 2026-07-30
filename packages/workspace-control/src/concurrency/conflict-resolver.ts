import {
	CONFLICT_RESOLUTION_STRATEGY,
	type ConflictEvent,
	type ConflictResolutionStrategy,
} from "./types";

// ─── Conflict Resolver ───────────────────────────────────────────────────────

export interface ConflictResolver {
	resolve(conflict: ConflictEvent): ConflictResolutionStrategy;
}

export class DefaultConflictResolver implements ConflictResolver {
	resolve(conflict: ConflictEvent): ConflictResolutionStrategy {
		switch (conflict.resourceType) {
			case "workspace":
			case "layout":
				// Revision is the authority for workspace and layout
				return CONFLICT_RESOLUTION_STRATEGY.SERVER_WINS;
			case "execution":
				// Authority model handles execution conflicts
				return CONFLICT_RESOLUTION_STRATEGY.NOTIFY_ONLY;
			case "view":
				// Last write wins for view placement
				return CONFLICT_RESOLUTION_STRATEGY.CLIENT_WINS;
		}
	}
}

// ─── Conflict Detection ─────────────────────────────────────────────────────

export function detectConflict(
	expectedRevision: number,
	actualRevision: number,
): ConflictEvent | null {
	if (expectedRevision === actualRevision) {
		return null;
	}

	return {
		resourceId: "",
		resourceType: "workspace",
		expectedRevision,
		actualRevision,
		timestamp: new Date().toISOString(),
	};
}
