/**
 * fraudDetector — Unit Tests
 *
 * Spec: fraud pattern detection algorithms
 * - detectDigitFatigue(): statistical analysis of digitizer patterns
 * - detectAnomalousResults(): outlier detection per polling station
 * - detectPatternManipulation(): repeating digit patterns
 */
import { describe, expect, it } from "vitest";
import {
	detectAnomalousResults,
	detectDigitFatigue,
	detectPatternManipulation,
} from "../validation/fraudDetector";

describe("detectDigitFatigue", () => {
	it("should detect fatigue when last digit is disproportionately low", () => {
		const result = detectDigitFatigue([
			{ candidateId: "c1", votes: 500, expectedDistribution: 0.25 },
			{ candidateId: "c2", votes: 480, expectedDistribution: 0.25 },
			{ candidateId: "c3", votes: 490, expectedDistribution: 0.25 },
			{ candidateId: "c4", votes: 30, expectedDistribution: 0.25 }, // significantly low
		]);

		expect(result.hasFatigue).toBe(true);
		expect(result.indicators.length).toBeGreaterThan(0);
	});

	it("should not detect fatigue when distribution is balanced", () => {
		const result = detectDigitFatigue([
			{ candidateId: "c1", votes: 250, expectedDistribution: 0.25 },
			{ candidateId: "c2", votes: 260, expectedDistribution: 0.25 },
			{ candidateId: "c3", votes: 240, expectedDistribution: 0.25 },
			{ candidateId: "c4", votes: 250, expectedDistribution: 0.25 },
		]);

		expect(result.hasFatigue).toBe(false);
		expect(result.indicators).toEqual([]);
	});

	it("should return no fatigue for empty input", () => {
		const result = detectDigitFatigue([]);

		expect(result.hasFatigue).toBe(false);
		expect(result.indicators).toEqual([]);
	});
});

describe("detectAnomalousResults", () => {
	it("should detect outlier when a station deviates significantly from mean", () => {
		const result = detectAnomalousResults([
			{ stationId: "ps-1", turnout: 0.6 },
			{ stationId: "ps-2", turnout: 0.58 },
			{ stationId: "ps-3", turnout: 0.62 },
			{ stationId: "ps-4", turnout: 0.59 },
			{ stationId: "ps-5", turnout: 0.61 },
			{ stationId: "ps-6", turnout: 0.6 },
			{ stationId: "ps-7", turnout: 0.98 }, // outlier
			{ stationId: "ps-8", turnout: 0.59 },
		]);

		expect(result.hasAnomaly).toBe(true);
		expect(result.outliers.length).toBeGreaterThan(0);
		expect(result.outliers[0].stationId).toBe("ps-7");
	});

	it("should not detect anomalies when all stations are similar", () => {
		const result = detectAnomalousResults([
			{ stationId: "ps-1", turnout: 0.6 },
			{ stationId: "ps-2", turnout: 0.61 },
			{ stationId: "ps-3", turnout: 0.59 },
		]);

		expect(result.hasAnomaly).toBe(false);
		expect(result.outliers).toEqual([]);
	});

	it("should handle single station (no comparison possible)", () => {
		const result = detectAnomalousResults([
			{ stationId: "ps-1", turnout: 0.95 },
		]);

		expect(result.hasAnomaly).toBe(false);
	});

	it("should handle empty input", () => {
		const result = detectAnomalousResults([]);

		expect(result.hasAnomaly).toBe(false);
	});
});

describe("detectPatternManipulation", () => {
	it("should detect manipulation when digits repeat in an unnatural pattern", () => {
		const result = detectPatternManipulation([
			{ candidateId: "c1", votes: 111 },
			{ candidateId: "c2", votes: 222 },
			{ candidateId: "c3", votes: 333 },
		]);

		expect(result.hasManipulation).toBe(true);
		expect(result.manipulatedCandidates.length).toBeGreaterThan(0);
	});

	it("should not flag natural-looking vote counts", () => {
		const result = detectPatternManipulation([
			{ candidateId: "c1", votes: 387 },
			{ candidateId: "c2", votes: 452 },
			{ candidateId: "c3", votes: 128 },
		]);

		expect(result.hasManipulation).toBe(false);
		expect(result.manipulatedCandidates).toEqual([]);
	});

	it("should detect round-number pattern manipulation", () => {
		const result = detectPatternManipulation([
			{ candidateId: "c1", votes: 500 },
			{ candidateId: "c2", votes: 500 },
			{ candidateId: "c3", votes: 100 },
		]);

		// 500 has trailing zeros pattern
		expect(result.hasManipulation).toBe(true);
	});

	it("should handle empty input", () => {
		const result = detectPatternManipulation([]);

		expect(result.hasManipulation).toBe(false);
	});
});
