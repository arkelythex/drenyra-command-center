/**
 * Learning Reconciliation Strategy — wraps existing strategies with ML-like learning.
 * Learns from past matches and auto-approves high-confidence results.
 */

import type {
	BankTransactionLike,
	MatchCandidate,
	MatchContext,
	MatchingStrategy,
} from "../../../apps/api/src/features/banking/domain/services/matching-strategy";
import { MatchHistoryStore } from "./match-history.store";

export class LearningMatchingStrategy implements MatchingStrategy {
	readonly priority = 110; // Higher than reference matching
	readonly criteria = "LEARNED" as never;

	private store: MatchHistoryStore;

	constructor(store?: MatchHistoryStore) {
		this.store = store ?? new MatchHistoryStore();
	}

	async match(
		tx: BankTransactionLike,
		_context: MatchContext,
	): Promise<MatchCandidate | null> {
		const learned = this.store.getLearnedMatch(tx.description ?? "", tx.amount);
		if (!learned) return null;

		return {
			documentId: learned.documentId,
			documentType: learned.documentType,
			score: learned.confidence >= 0.9 ? 99 : learned.score,
			criteria: "REFERENCE" as never,
			relatedTransactionIds: learned.autoApprovable
				? ["auto-approvable"]
				: undefined,
		};
	}
}
