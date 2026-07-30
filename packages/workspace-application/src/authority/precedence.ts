import type {
	AuthoritativeStateRecord,
	AuthorityPrecedenceResult,
} from "./types";
import { AUTHORITY_LEVEL } from "./types";

// ─── Authority Rank Map ──────────────────────────────────────────────────────

const AUTHORITY_RANK: Record<string, number> = {
	[AUTHORITY_LEVEL.OBSERVED]: 0,
	[AUTHORITY_LEVEL.REPORTED]: 1,
	[AUTHORITY_LEVEL.AUTHORITATIVE]: 2,
};

// ─── Precedence ──────────────────────────────────────────────────────────────

/**
 * Determines whether an incoming state record should replace an existing one.
 *
 * Rules:
 * 1. If incoming.sequence <= existing.sequence → reject as duplicate/out-of-order
 * 2. If incoming.authority < existing.authority → reject (lower authority can't overwrite)
 * 3. If incoming.authority === existing.authority && incoming.effectiveAt < existing.effectiveAt
 *    → reject (same authority, older)
 * 4. If incoming.authority === existing.authority && incoming.sequence > existing.sequence → apply
 * 5. If incoming.authority > existing.authority && incoming.effectiveAt >= existing.effectiveAt → apply
 * 6. If incoming.authority > existing.authority && incoming.effectiveAt < existing.effectiveAt
 *    → reject (prevent authority downgrade through old data)
 */
export function shouldApplyState(
	existing: AuthoritativeStateRecord,
	incoming: AuthoritativeStateRecord,
): AuthorityPrecedenceResult {
	// Rule 1: duplicate or out-of-order sequence
	if (incoming.sequence <= existing.sequence) {
		return {
			apply: false,
			reason: `Rejected: incoming sequence ${incoming.sequence} is not greater than existing sequence ${existing.sequence} (duplicate or out-of-order)`,
		};
	}

	const incomingRank = AUTHORITY_RANK[incoming.authority] ?? -1;
	const existingRank = AUTHORITY_RANK[existing.authority] ?? -1;

	// Rule 2: lower authority can't overwrite higher authority
	if (incomingRank < existingRank) {
		return {
			apply: false,
			reason: `Rejected: incoming authority "${incoming.authority}" is lower than existing authority "${existing.authority}"`,
		};
	}

	// Rule 3: same authority, older effectiveAt
	if (
		incomingRank === existingRank &&
		incoming.effectiveAt < existing.effectiveAt
	) {
		return {
			apply: false,
			reason: `Rejected: same authority "${incoming.authority}" but incoming effectiveAt ${incoming.effectiveAt} is older than existing ${existing.effectiveAt}`,
		};
	}

	// Rule 4: same authority, higher sequence → apply
	if (incomingRank === existingRank && incoming.sequence > existing.sequence) {
		return {
			apply: true,
			reason: `Applied: same authority "${incoming.authority}" with higher sequence ${incoming.sequence} > ${existing.sequence}`,
		};
	}

	// Rule 5: higher authority, newer or equal effectiveAt → apply
	if (
		incomingRank > existingRank &&
		incoming.effectiveAt >= existing.effectiveAt
	) {
		return {
			apply: true,
			reason: `Applied: higher authority "${incoming.authority}" with newer or equal effectiveAt`,
		};
	}

	// Rule 6: higher authority but older effectiveAt → reject
	return {
		apply: false,
		reason: `Rejected: higher authority "${incoming.authority}" but incoming effectiveAt ${incoming.effectiveAt} is older than existing ${existing.effectiveAt} (downgrade prevention)`,
	};
}
