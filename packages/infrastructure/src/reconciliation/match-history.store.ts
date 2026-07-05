/**
 * Match History Store — in-memory + DB-backed store for match corrections.
 * Learns from user-approved and user-corrected matches.
 */

import type {
	LearningMatchResult,
	MatchHistoryRecord,
	VendorPattern,
} from "@drenyra/application/ports/reconciliation-learning.port";

export class MatchHistoryStore {
	private history: MatchHistoryRecord[] = [];
	private patterns = new Map<string, VendorPattern>();

	async recordMatch(match: MatchHistoryRecord): Promise<void> {
		this.history.push(match);
		await this.updatePatterns(match);
	}

	async recordCorrection(
		bankTxId: string,
		correctedDocId: string,
	): Promise<void> {
		const record = this.history.find((h) => h.bankTransactionId === bankTxId);
		if (record) {
			record.userApproved = false;
			record.userCorrectedDocumentId = correctedDocId;
			record.userCorrectedAt = new Date();
		}
	}

	async recordApproval(bankTxId: string): Promise<void> {
		const record = this.history.find((h) => h.bankTransactionId === bankTxId);
		if (record) {
			record.userApproved = true;
		}
	}

	findByDescription(description: string): MatchHistoryRecord[] {
		const norm = this.normalize(description);
		return this.history.filter((h) => this.normalize(h.bankDescription).includes(norm) || norm.includes(this.normalize(h.bankDescription)));
	}

	findByAmount(amount: string): MatchHistoryRecord[] {
		return this.history.filter((h) => h.bankAmount === amount);
	}

	getVendorPattern(vendorId: string): VendorPattern | undefined {
		return this.patterns.get(vendorId);
	}

	getLearnedMatch(
		description: string,
		amount: string,
	): LearningMatchResult | null {
		// 1. Try exact description match from history
		const byDesc = this.findByDescription(description);
		const approvedDesc = byDesc.filter((h) => h.userApproved === true);

		if (approvedDesc.length > 0) {
			const best = approvedDesc.reduce((a, b) =>
				a.matchScore > b.matchScore ? a : b,
			);
			return {
				documentId: best.matchedDocumentId,
				documentType: best.matchedDocumentType,
				score: best.matchScore,
				source: "LEARNED_PATTERN",
				confidence: 0.92,
				autoApprovable: best.matchScore >= 95,
			};
		}

		// 2. Try amount-based matching from history
		const byAmount = this.findByAmount(amount);
		const approvedAmount = byAmount.filter((h) => h.userApproved === true);
		if (approvedAmount.length > 0) {
			const best = approvedAmount.reduce((a, b) =>
				a.matchScore > b.matchScore ? a : b,
			);
			return {
				documentId: best.matchedDocumentId,
				documentType: best.matchedDocumentType,
				score: best.matchScore,
				source: "LEARNED_PATTERN",
				confidence: 0.85,
				autoApprovable: false,
			};
		}

		return null;
	}

	private async updatePatterns(match: MatchHistoryRecord): Promise<void> {
		const desc = this.normalize(match.bankDescription);
		const tokens = desc.split(/\s+/).filter((t) => t.length > 3);

		for (const [, pattern] of this.patterns) {
			const matchTokens = tokens.filter((t) =>
				pattern.descriptionPatterns.some((p) => t.includes(p) || p.includes(t)),
			);
			if (matchTokens.length >= 2) {
				pattern.matchCount++;
				pattern.lastMatchedAt = new Date();
				pattern.descriptionPatterns = [
					...new Set([...pattern.descriptionPatterns, ...tokens]),
				].slice(0, 20);
				return;
			}
		}
	}

	private normalize(value: string): string {
		return value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toUpperCase()
			.replace(/[^A-Z0-9\s]/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}
