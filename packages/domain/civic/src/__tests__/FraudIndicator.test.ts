/**
 * FraudIndicator Value Object — Unit Tests
 *
 * Spec: type (enum), severity (enum), confidence (0.0–1.0), description, evidence[], detectedAt
 */
import { describe, expect, it } from "vitest";
import {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "../value-object/FraudIndicator";

describe("FraudIndicator", () => {
	describe("Creation", () => {
		it("should create with valid VOTE_PATTERN_ANOMALY type and HIGH severity", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.HIGH,
				description: "Unusual vote pattern detected",
				evidence: ["act-123", "act-456"],
				detectedAt: new Date("2026-04-12T10:00:00Z"),
			});

			expect(indicator.type).toBe(FraudIndicatorType.VOTE_PATTERN_ANOMALY);
			expect(indicator.severity).toBe(FraudSeverity.HIGH);
			expect(indicator.description).toBe("Unusual vote pattern detected");
			expect(indicator.evidence).toEqual(["act-123", "act-456"]);
			expect(indicator.detectedAt).toEqual(new Date("2026-04-12T10:00:00Z"));
		});

		it("should create with CRITICAL severity", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.ACT_TAMPERING,
				severity: FraudSeverity.CRITICAL,
				description: "Act tampering detected",
				evidence: ["evidence-hash-001"],
				detectedAt: new Date(),
			});

			expect(indicator.severity).toBe(FraudSeverity.CRITICAL);
		});

		it("should create without optional evidence", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.MEDIUM,
				description: "Turnout spike",
				evidence: [],
				detectedAt: new Date(),
			});

			expect(indicator.type).toBe(FraudIndicatorType.TURNOUT_SPIKE);
			expect(indicator.evidence).toEqual([]);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.DUPLICATE_VOTER,
				severity: FraudSeverity.LOW,
				description: "Possible duplicate voter",
				evidence: [],
				detectedAt: new Date(),
			});

			expect(Object.isFrozen(indicator)).toBe(true);
		});
	});

	describe("Equality", () => {
		it("should be equal when same type, severity, description, and detectedAt", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const a = FraudIndicator.create({
				type: FraudIndicatorType.TIMESTAMP_IRREGULARITY,
				severity: FraudSeverity.MEDIUM,
				description: "Timestamp irregularity",
				evidence: ["ev-1"],
				detectedAt: date,
			});
			const b = FraudIndicator.create({
				type: FraudIndicatorType.TIMESTAMP_IRREGULARITY,
				severity: FraudSeverity.MEDIUM,
				description: "Timestamp irregularity",
				evidence: ["ev-1"],
				detectedAt: date,
			});

			expect(a.equals(b)).toBe(true);
		});

		it("should not be equal with different types", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const a = FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.HIGH,
				description: "Pattern anomaly",
				evidence: [],
				detectedAt: date,
			});
			const b = FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.HIGH,
				description: "Pattern anomaly",
				evidence: [],
				detectedAt: date,
			});

			expect(a.equals(b)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.CRITICAL,
				description: "Critical anomaly",
				evidence: ["ev-1", "ev-2"],
				detectedAt: date,
			});

			const json = indicator.toJSON();
			expect(json).toEqual({
				type: "VOTE_PATTERN_ANOMALY",
				severity: "CRITICAL",
				description: "Critical anomaly",
				evidence: ["ev-1", "ev-2"],
				detectedAt: date.toISOString(),
			});
		});
	});
});
