/**
 * PollingStation Entity — Unit Tests
 *
 * Spec: id, code, name, location, urnCount, registeredVoters, electionId
 */
import { describe, expect, it } from "vitest";
import { PollingStation } from "../entity/PollingStation";

describe("PollingStation", () => {
	describe("Creation", () => {
		it("should create with all required fields", () => {
			const ps = PollingStation.create({
				code: "PS-001",
				name: "IE 12345 San Juan",
				location: "Av. Principal 123, Lima",
				urnCount: 4,
				registeredVoters: 800,
				electionId: "election-1",
			});

			expect(ps.code).toBe("PS-001");
			expect(ps.name).toBe("IE 12345 San Juan");
			expect(ps.location).toBe("Av. Principal 123, Lima");
			expect(ps.urnCount).toBe(4);
			expect(ps.registeredVoters).toBe(800);
			expect(ps.electionId).toBe("election-1");
		});

		it("should generate UUID id if not provided", () => {
			const ps = PollingStation.create({
				code: "PS-002",
				name: "Test Station",
				location: "Test Location",
				urnCount: 2,
				registeredVoters: 400,
				electionId: "election-1",
			});

			expect(ps.id).toBeDefined();
			expect(typeof ps.id).toBe("string");
		});
	});

	describe("Validation", () => {
		it("should throw when urnCount is zero", () => {
			expect(() =>
				PollingStation.create({
					code: "PS-003",
					name: "Invalid Station",
					location: "Nowhere",
					urnCount: 0,
					registeredVoters: 400,
					electionId: "election-1",
				}),
			).toThrow(/urnCount must be positive/);
		});

		it("should throw when registeredVoters is zero", () => {
			expect(() =>
				PollingStation.create({
					code: "PS-004",
					name: "Invalid Station",
					location: "Nowhere",
					urnCount: 2,
					registeredVoters: 0,
					electionId: "election-1",
				}),
			).toThrow(/registeredVoters must be positive/);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const ps = PollingStation.create({
				code: "PS-005",
				name: "Test",
				location: "Test",
				urnCount: 2,
				registeredVoters: 400,
				electionId: "election-1",
			});

			expect(Object.isFrozen(ps)).toBe(true);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const ps = PollingStation.create({
				code: "PS-006",
				name: "JSON Test",
				location: "Location",
				urnCount: 3,
				registeredVoters: 600,
				electionId: "election-1",
			});

			const json = ps.toJSON();
			expect(json.code).toBe("PS-006");
			expect(json.urnCount).toBe(3);
			expect(json.registeredVoters).toBe(600);
		});
	});
});
