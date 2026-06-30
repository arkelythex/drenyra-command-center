export function detectDigitFatigue(inputs) {
    const indicators = [];
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
        if (deviation > input.expectedDistribution * 0.5 &&
            actualProportion < input.expectedDistribution) {
            indicators.push({
                candidateId: input.candidateId,
                deviation,
                description: `Vote proportion ${(actualProportion * 100).toFixed(1)}% is significantly below expected ${(input.expectedDistribution * 100).toFixed(1)}%`,
            });
        }
    }
    return { hasFatigue: indicators.length > 0, indicators };
}
export function detectAnomalousResults(stations) {
    if (stations.length < 2) {
        return { hasAnomaly: false, outliers: [] };
    }
    const turnouts = stations.map((s) => s.turnout);
    const mean = turnouts.reduce((a, b) => a + b, 0) / turnouts.length;
    const variance = turnouts.reduce((sum, t) => sum + (t - mean) ** 2, 0) / turnouts.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) {
        return { hasAnomaly: false, outliers: [] };
    }
    const outliers = [];
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
export function detectPatternManipulation(candidates) {
    const manipulatedCandidates = [];
    for (const c of candidates) {
        const votesStr = c.votes.toString();
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
//# sourceMappingURL=fraudDetector.js.map