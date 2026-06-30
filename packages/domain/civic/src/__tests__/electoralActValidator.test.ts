/**
 * electoralActValidator — Unit Tests
 *
 * Spec: pure functions for validating electoral acts
 * - validateVoteTally(): sum of votes <= registered voters
 * - validateDigitIntegrity(): no duplicate serial numbers
 * - validateUrnSeal(): seal integrity check
 */
import { describe, expect, it } from "vitest";
import {
	validateDigitIntegrity,
	validateUrnSeal,
	validateVoteTally,
} from "../validation/electoralActValidator";
import { VoteTally } from "../value-object/VoteTally";

describe("validateVoteTally", () => {
	it("should pass when total votes <= registered voters", () => {
		const result = validateVoteTally(
			[
				VoteTally.create({
					candidateId: "c1",
					candidateName: "A",
					party: "X",
					voteCount: 300,
					isValid: true,
				}),
				VoteTally.create({
					candidateId: "c2",
					candidateName: "B",
					party: "Y",
					voteCount: 200,
					isValid: true,
				}),
			],
			600,
		);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("should fail when total votes exceed registered voters", () => {
		const result = validateVoteTally(
			[
				VoteTally.create({
					candidateId: "c1",
					candidateName: "A",
					party: "X",
					voteCount: 400,
					isValid: true,
				}),
				VoteTally.create({
					candidateId: "c2",
					candidateName: "B",
					party: "Y",
					voteCount: 300,
					isValid: true,
				}),
			],
			600,
		);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("exceed");
	});

	it("should pass with zero votes and zero registered voters", () => {
		const result = validateVoteTally([], 0);

		expect(result.valid).toBe(true);
	});

	it("should fail when tallies array is empty but registeredVoters > 0", () => {
		const result = validateVoteTally([], 500);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});
});

describe("validateDigitIntegrity", () => {
	it("should pass when all serial numbers are unique", () => {
		const acts = [
			{ actNumber: "ACT-001", urnNumber: 1 },
			{ actNumber: "ACT-002", urnNumber: 2 },
			{ actNumber: "ACT-003", urnNumber: 3 },
		];

		const result = validateDigitIntegrity(acts);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("should fail when serial numbers are duplicated", () => {
		const acts = [
			{ actNumber: "ACT-001", urnNumber: 1 },
			{ actNumber: "ACT-001", urnNumber: 2 }, // duplicate actNumber
		];

		const result = validateDigitIntegrity(acts);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("Duplicate");
	});

	it("should fail when urn numbers are duplicated", () => {
		const acts = [
			{ actNumber: "ACT-001", urnNumber: 1 },
			{ actNumber: "ACT-002", urnNumber: 1 }, // duplicate urnNumber
		];

		const result = validateDigitIntegrity(acts);
		expect(result.valid).toBe(false);
	});

	it("should pass with a single act", () => {
		const acts = [{ actNumber: "ACT-001", urnNumber: 1 }];

		const result = validateDigitIntegrity(acts);
		expect(result.valid).toBe(true);
	});
});

describe("validateUrnSeal", () => {
	it("should pass when seal is intact", () => {
		const result = validateUrnSeal("SEAL-INTACT-001", true);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("should fail when seal is broken", () => {
		const result = validateUrnSeal("SEAL-BROKEN-001", false);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should fail with empty seal ID", () => {
		const result = validateUrnSeal("", true);
		expect(result.valid).toBe(false);
	});

	it("should fail with nullish seal ID", () => {
		const result = validateUrnSeal("", false);
		expect(result.valid).toBe(false);
	});
});
