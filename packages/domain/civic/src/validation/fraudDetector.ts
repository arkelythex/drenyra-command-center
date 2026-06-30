/**
 * fraudDetector — Pure functions for fraud pattern detection
 *
 * All functions are PURE (no side effects, no I/O)
 * Algorithms inspired by elect-validate Go implementation
 */

export interface DigitFatigueInput {
	candidateId: string;
	votes: number;
	expectedDistribution: number; // 0.0–1.0, expected proportion
}

export interface FatigueResult {
	hasFatigue: boolean;
	indicators: Array<{
		candidateId: string;
		deviation: number;
		description: string;
	}>;
}

export interface StationTurnout {
	stationId: string;
	turnout: number; // 0.0–1.0, percentage of registered voters who voted
}

export interface AnomalyResult {
	hasAnomaly: boolean;
	outliers: Array<{ stationId: string; turnout: number; zScore: number }>;
}

export interface CandidateVotes {
	candidateId: string;
	votes: number;
}

export interface ManipulationResult {
	hasManipulation: boolean;
	manipulatedCandidates: Array<{
		candidateId: string;
		votes: number;
		reason: string;
	}>;
}

/**
 * detectDigitFatigue — Detect if a candidate's vote count is disproportionately low
 * compared to expected distribution (indicates possible digit fatigue / attention drop)
 */
export function detectDigitFatigue(inputs: DigitFatigueInput[]): FatigueResult {
	const indicators: FatigueResult["indicators"] = [];

	if (inputs.length === 0) {
		return { hasFatigue: false, indicators: [] };
	}

	const totalVotes = inputs.reduce((sum, i) => sum + i.votes, 0);
	if (totalVotes === 0) {
		return { hasFatigue: false, indicators: [] };
	}

	for (const input of inputs) {
		const actualProportion = input.votes / totalVotes;
		const deviation = Math.abs(actualProportion - input.expectedDistribution);

		// If deviation > 50% of expected, flag as potential fatigue
		if (
			deviation > input.expectedDistribution * 0.5 &&
			actualProportion < input.expectedDistribution
		) {
			indicators.push({
				candidateId: input.candidateId,
				deviation,
				description: `Vote proportion ${(actualProportion * 100).toFixed(1)}% is significantly below expected ${(input.expectedDistribution * 100).toFixed(1)}%`,
			});
		}
	}

	return { hasFatigue: indicators.length > 0, indicators };
}

/**
 * detectAnomalousResults — Detect outlier polling stations using simple deviation analysis
 * Stations with turnout > 2 standard deviations from mean are flagged
 */
export function detectAnomalousResults(
	stations: StationTurnout[],
): AnomalyResult {
	if (stations.length < 2) {
		return { hasAnomaly: false, outliers: [] };
	}

	const turnouts = stations.map((s) => s.turnout);
	const mean = turnouts.reduce((a, b) => a + b, 0) / turnouts.length;
	const variance =
		turnouts.reduce((sum, t) => sum + (t - mean) ** 2, 0) / turnouts.length;
	const stdDev = Math.sqrt(variance);

	if (stdDev === 0) {
		return { hasAnomaly: false, outliers: [] };
	}

	const outliers: AnomalyResult["outliers"] = [];
	for (const station of stations) {
		const zScore = (station.turnout - mean) / stdDev;
		if (Math.abs(zScore) > 2) {
			outliers.push({
				stationId: station.stationId,
				turnout: station.turnout,
				zScore,
			});
		}
	}

	return { hasAnomaly: outliers.length > 0, outliers };
}

/**
 * detectPatternManipulation — Detect unnatural repeating digit patterns
 * Flags vote counts with repeating digits (111, 222) or round numbers (500, 1000)
 */
export function detectPatternManipulation(
	candidates: CandidateVotes[],
): ManipulationResult {
	const manipulatedCandidates: ManipulationResult["manipulatedCandidates"] = [];

	for (const c of candidates) {
		const votesStr = c.votes.toString();

		// Check for repeating digits (e.g., 111, 222, 333)
		if (votesStr.length >= 3) {
			const uniqueDigits = new Set(votesStr.split(""));
			if (uniqueDigits.size === 1) {
				manipulatedCandidates.push({
					candidateId: c.candidateId,
					votes: c.votes,
					reason: `Repeating digit pattern: ${votesStr}`,
				});
				continue;
			}
		}

		// Check for round numbers ending in 00 or 000
		if (c.votes >= 100 && c.votes % 100 === 0) {
			manipulatedCandidates.push({
				candidateId: c.candidateId,
				votes: c.votes,
				reason: `Suspicious round number: ${votesStr}`,
			});
		}
	}

	return {
		hasManipulation: manipulatedCandidates.length > 0,
		manipulatedCandidates,
	};
}
