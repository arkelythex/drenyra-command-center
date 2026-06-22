import type { FiscalTruthEvent } from "../entities/FiscalTruthEvent";
import type { ChainVerificationResult, FiscalTruthScope } from "../types";

/**
 * Repository contract for append-only authoritative fiscal truth events.
 */
export interface FiscalTruthRepository {
	append(event: FiscalTruthEvent): Promise<void>;
	findByEventId(
		eventId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent | null>;
	findByAggregateId(
		aggregateId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent[]>;

	/**
	 * Verify the cryptographic hash chain for all events in the given scope.
	 *
	 * Iterates events ordered by `occurredAt` and checks:
	 * 1. Each event's `prevHash` matches the previous event's `chainHash`.
	 * 2. Each event's `chainHash` equals `SHA-256(payload + prevHash)`.
	 *
	 * Pre-migration events (empty-string markers) are skipped.
	 */
	verifyChain(scope: FiscalTruthScope): Promise<ChainVerificationResult>;
}
