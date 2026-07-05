import type { MatchCriteria } from "../types";

/**
 * Match Score Value Object
 * Represents confidence level (0-100) for reconciliation matching
 *
 * @throws {Error} If the provided score is not between 0 and 100
 *
 * @example
 * ```ts
 * const score = MatchScore.fromCriteria("AMOUNT_DATE");
 * score.isAboveThreshold(); // true
 * ```
 */

export class MatchScore {
	static readonly PERFECT = 100;
	static readonly HIGH = 80;
	static readonly MEDIUM = 60;
	static readonly LOW = 40;
	static readonly MIN_THRESHOLD = 60;

	private constructor(
		private readonly value: number,
		private readonly criteria: MatchCriteria,
	) {
		Object.freeze(this);
	}

	static create(score: number, criteria: MatchCriteria): MatchScore {
		if (!MatchScore.isValid(score)) {
			throw new Error(
				`Invalid match score: ${score}. Must be between 0 and 100.`,
			);
		}

		return new MatchScore(Math.round(score), criteria);
	}

	static fromCriteria(criteria: MatchCriteria): MatchScore {
		const scoreMap: Record<MatchCriteria, number> = {
			REFERENCE: MatchScore.PERFECT,
			AMOUNT_DATE: MatchScore.HIGH,
			AMOUNT_ENTITY: MatchScore.MEDIUM,
			PARTIAL: MatchScore.MEDIUM,
		};

		return new MatchScore(scoreMap[criteria], criteria);
	}

	static isValid(score: number): boolean {
		return Number.isFinite(score) && score >= 0 && score <= 100;
	}

	getValue(): number {
		return this.value;
	}

	getCriteria(): MatchCriteria {
		return this.criteria;
	}

	isAboveThreshold(): boolean {
		return this.value >= MatchScore.MIN_THRESHOLD;
	}

	isPerfect(): boolean {
		return this.value === MatchScore.PERFECT;
	}

	isHigh(): boolean {
		return this.value >= MatchScore.HIGH;
	}

	isMedium(): boolean {
		return this.value >= MatchScore.MEDIUM && this.value < MatchScore.HIGH;
	}

	isLow(): boolean {
		return this.value < MatchScore.MEDIUM;
	}

	getConfidenceLevel(): "PERFECT" | "HIGH" | "MEDIUM" | "LOW" {
		if (this.isPerfect()) return "PERFECT";
		if (this.isHigh()) return "HIGH";
		if (this.isMedium()) return "MEDIUM";
		return "LOW";
	}

	compareTo(other: MatchScore): number {
		return this.value - other.value;
	}

	isHigherThan(other: MatchScore): boolean {
		return this.value > other.value;
	}

	equals(other: MatchScore | null | undefined): boolean {
		if (!other) return false;
		return this.value === other.value && this.criteria === other.criteria;
	}

	toString(): string {
		return `${this.value}% (${this.criteria})`;
	}

	toJSON(): { score: number; criteria: MatchCriteria; confidence: string } {
		return {
			score: this.value,
			criteria: this.criteria,
			confidence: this.getConfidenceLevel(),
		};
	}
}
