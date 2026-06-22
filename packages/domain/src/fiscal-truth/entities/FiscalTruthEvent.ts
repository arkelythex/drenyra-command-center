import type { FiscalTruthScope, FiscalTruthTrace } from "../types";
import type { TruthEventKind } from "./shared";

/**
 * Append-only authoritative fiscal event.
 *
 * This contract represents the canonical truth transition and must always
 * include scope, deterministic versions, and a root evidence link.
 *
 * When hash-chaining is active (post-migration), `prevHash` and `chainHash`
 * provide cryptographic integrity verification via `FiscalTruthRepository.verifyChain()`.
 * Pre-migration events have these fields set to empty strings.
 */
export interface FiscalTruthEvent {
	eventId: string;
	aggregateId: string;
	aggregateType: string;
	eventKind: TruthEventKind;
	scope: FiscalTruthScope;
	trace: FiscalTruthTrace;
	validatorSetVersion: string;
	policyVersion: string;
	evidenceRootNodeId: string;
	evidenceBundleHash: string;
	approvalId: string | null;
	occurredAt: string;
	payload: Record<string, unknown>;
	/** @optional — SHA-256 hash of the previous event in this scope's chain. */
	prevHash?: string;
	/** @optional — SHA-256 hash of this event's payload + prevHash. */
	chainHash?: string;
}
