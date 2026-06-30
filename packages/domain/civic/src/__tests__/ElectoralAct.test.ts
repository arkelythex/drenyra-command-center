/**
 * ElectoralAct Entity — Unit Tests
 *
 * Spec: id, stationId, urnNumber, voteTallies (Map<string, number>), validationStatus, validatedAt, validatedBy
 */
import { describe, expect, it } from "vitest";
import { ElectoralAct, ValidationStatus } from "../entity/ElectoralAct";

describe("ElectoralAct", () => {
	describe("Creation", () => {
		it("should create with required fields", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([["cand-1", 100]]),
			});

			expect(act.stationId).toBe("ps-1");
			expect(act.urnNumber).toBe(1);
			expect(act.validationStatus).toBe(ValidationStatus.PENDING);
			expect(act.voteTallies.get("cand-1")).toBe(100);
		});

		it("should create with validation status", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 2,
				voteTallies: new Map([["cand-1", 80]]),
				validationStatus: ValidationStatus.VALID,
				validatedAt: new Date("2026-04-12T12:00:00Z"),
				validatedBy: "validator-1",
			});

			expect(act.validationStatus).toBe(ValidationStatus.VALID);
			expect(act.validatedAt).toEqual(new Date("2026-04-12T12:00:00Z"));
			expect(act.validatedBy).toBe("validator-1");
		});

		it("should throw when voteTallies is empty", () => {
			expect(() =>
				ElectoralAct.create({
					stationId: "ps-1",
					urnNumber: 1,
					voteTallies: new Map(),
				}),
			).toThrow(/voteTallies must not be empty/);
		});
	});

	describe("Validation Status Transitions", () => {
		it("should mark as valid", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([["cand-1", 100]]),
			});

			const validated = act.markValid("validator-1");
			expect(validated.validationStatus).toBe(ValidationStatus.VALID);
			expect(validated.validatedBy).toBe("validator-1");
		});

		it("should mark as invalid", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([["cand-1", 100]]),
			});

			const invalid = act.markInvalid("validator-1");
			expect(invalid.validationStatus).toBe(ValidationStatus.INVALID);
		});

		it("should throw when validating already validated act", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([["cand-1", 100]]),
				validationStatus: ValidationStatus.VALID,
			});

			expect(() => act.markValid("validator-2")).toThrow(
				/Cannot validate an act with status VALID/,
			);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([["cand-1", 100]]),
			});

			expect(Object.isFrozen(act)).toBe(true);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const act = ElectoralAct.create({
				stationId: "ps-1",
				urnNumber: 1,
				voteTallies: new Map([
					["cand-1", 100],
					["cand-2", 80],
				]),
			});

			const json = act.toJSON();
			expect(json.stationId).toBe("ps-1");
			expect(json.urnNumber).toBe(1);
			expect(json.validationStatus).toBe("PENDING");
		});
	});
});
