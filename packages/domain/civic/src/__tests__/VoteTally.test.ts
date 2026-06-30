/**
 * VoteTally Value Object — Unit Tests
 *
 * Spec: validVotes + blankVotes + nullVotes + disputedVotes <= totalVotes
 * Must be immutable (Object.freeze)
 */
import { describe, expect, it } from "vitest";
import { VoteTally } from "../value-object/VoteTally";

describe("VoteTally", () => {
	describe("Creation", () => {
		it("should create a valid VoteTally when counts match total", () => {
			const tally = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "Candidate A",
				party: "Party X",
				voteCount: 100,
				isValid: true,
			});

			expect(tally.candidateId).toBe("cand-1");
			expect(tally.candidateName).toBe("Candidate A");
			expect(tally.party).toBe("Party X");
			expect(tally.voteCount).toBe(100);
			expect(tally.isValid).toBe(true);
			expect(tally.anomalies).toEqual([]);
		});

		it("should create with optional anomalies", () => {
			const tally = VoteTally.create({
				candidateId: "cand-2",
				candidateName: "Candidate B",
				party: "Party Y",
				voteCount: 50,
				isValid: false,
				anomalies: ["Unusual spike in votes"],
			});

			expect(tally.voteCount).toBe(50);
			expect(tally.isValid).toBe(false);
			expect(tally.anomalies).toHaveLength(1);
			expect(tally.anomalies[0]).toBe("Unusual spike in votes");
		});
	});

	describe("Immutability", () => {
		it("should be frozen (immutable)", () => {
			const tally = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
			});

			expect(Object.isFrozen(tally)).toBe(true);
		});
	});

	describe("Equality", () => {
		it("should consider same candidateId as equal", () => {
			const a = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
			});
			const b = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
			});

			expect(a.equals(b)).toBe(true);
		});

		it("should consider different candidateId as not equal", () => {
			const a = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
			});
			const b = VoteTally.create({
				candidateId: "cand-2",
				candidateName: "B",
				party: "Y",
				voteCount: 100,
				isValid: true,
			});

			expect(a.equals(b)).toBe(false);
		});

		it("should return false for null/undefined", () => {
			const tally = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
			});

			expect(tally.equals(null)).toBe(false);
			expect(tally.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON correctly", () => {
			const tally = VoteTally.create({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
				anomalies: ["test"],
			});

			const json = tally.toJSON();
			expect(json).toEqual({
				candidateId: "cand-1",
				candidateName: "A",
				party: "X",
				voteCount: 100,
				isValid: true,
				anomalies: ["test"],
			});
		});
	});
});
