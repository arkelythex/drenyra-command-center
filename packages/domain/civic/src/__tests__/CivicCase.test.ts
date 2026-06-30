/**
 * CivicCase Aggregate — Unit Tests
 *
 * Spec: id, name, electionIds, fraudIndicators, timeline, status with valid transitions
 */
import { describe, expect, it } from "vitest";
import { CivicCase, CivicCaseStatus } from "../entity/CivicCase";
import {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "../value-object/FraudIndicator";

describe("CivicCase", () => {
	describe("Creation", () => {
		it("should create with draft status by default", () => {
			const civicCase = CivicCase.create({
				name: "Caso Elecciones 2026",
			});

			expect(civicCase.name).toBe("Caso Elecciones 2026");
			expect(civicCase.status).toBe(CivicCaseStatus.DRAFT);
			expect(civicCase.electionIds).toEqual([]);
			expect(civicCase.fraudIndicators).toEqual([]);
			expect(civicCase.timeline).toEqual([]);
		});

		it("should create with explicit status", () => {
			const civicCase = CivicCase.create({
				name: "Caso Activo",
				status: CivicCaseStatus.ACTIVE,
			});

			expect(civicCase.status).toBe(CivicCaseStatus.ACTIVE);
		});

		it("should create with initial data", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.HIGH,
				description: "Patrón sospechoso en mesa 123",
				evidence: ["ev-001"],
				detectedAt: new Date("2026-04-12"),
			});

			const civicCase = CivicCase.create({
				name: "Caso Completo",
				electionIds: ["election-1"],
				fraudIndicators: [indicator],
				timeline: ["Caso abierto"],
			});

			expect(civicCase.electionIds).toHaveLength(1);
			expect(civicCase.fraudIndicators).toHaveLength(1);
			expect(civicCase.timeline).toHaveLength(1);
			expect(civicCase.timeline[0]).toBe("Caso abierto");
		});
	});

	describe("Status Transitions", () => {
		it("should activate from draft", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			const activated = civicCase.activate();
			expect(activated.status).toBe(CivicCaseStatus.ACTIVE);
			expect(civicCase.status).toBe(CivicCaseStatus.DRAFT); // original unchanged
		});

		it("should complete from active", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				status: CivicCaseStatus.ACTIVE,
			});

			const completed = civicCase.complete();
			expect(completed.status).toBe(CivicCaseStatus.COMPLETED);
		});

		it("should escalate from completed", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				status: CivicCaseStatus.COMPLETED,
			});

			const escalated = civicCase.escalate("Se requiere intervención judicial");
			expect(escalated.status).toBe(CivicCaseStatus.ESCALATED);
		});

		it("should resolve from escalated", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				status: CivicCaseStatus.ESCALATED,
			});

			const resolved = civicCase.resolve();
			expect(resolved.status).toBe(CivicCaseStatus.RESOLVED);
		});

		it("should throw when activating from completed", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				status: CivicCaseStatus.COMPLETED,
			});

			expect(() => civicCase.activate()).toThrow(
				/Cannot transition civic case from COMPLETED to ACTIVE/,
			);
		});

		it("should throw when completing from draft", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			expect(() => civicCase.complete()).toThrow(
				/Cannot transition civic case from DRAFT to COMPLETED/,
			);
		});

		it("should throw when escalating without reason", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				status: CivicCaseStatus.COMPLETED,
			});

			expect(() => civicCase.escalate("")).toThrow(
				/Escalation reason is required/,
			);
		});

		it("should throw when resolving from draft", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			expect(() => civicCase.resolve()).toThrow(
				/Cannot transition civic case from DRAFT to RESOLVED/,
			);
		});
	});

	describe("Election Management", () => {
		it("should add election reference", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			const updated = civicCase.addElection("election-1");
			expect(updated.electionIds).toHaveLength(1);
			expect(updated.electionIds[0]).toBe("election-1");
		});

		it("should not add duplicate election references", () => {
			const civicCase = CivicCase.create({
				name: "Test",
				electionIds: ["election-1"],
			});

			expect(() => civicCase.addElection("election-1")).toThrow(
				/Election election-1 already registered/,
			);
		});
	});

	describe("Fraud Indicator Management", () => {
		it("should add fraud indicator", () => {
			const civicCase = CivicCase.create({ name: "Test" });
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.MEDIUM,
				description: "Pico de participación inusual",
				evidence: ["ev-002"],
				detectedAt: new Date("2026-04-12"),
			});

			const updated = civicCase.addFraudIndicator(indicator);
			expect(updated.fraudIndicators).toHaveLength(1);
			expect(updated.fraudIndicators[0].type).toBe(
				FraudIndicatorType.TURNOUT_SPIKE,
			);
		});
	});

	describe("Timeline Events", () => {
		it("should add timeline event", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			const updated = civicCase.addTimelineEvent("Evidencia analizada");
			expect(updated.timeline).toHaveLength(1);
			expect(updated.timeline[0]).toBe("Evidencia analizada");
		});

		it("should append multiple timeline events", () => {
			const civicCase = CivicCase.create({ name: "Test" });

			const step1 = civicCase.addTimelineEvent("Caso abierto");
			const step2 = step1.addTimelineEvent("En investigación");
			const step3 = step2.addTimelineEvent("Finalizado");

			expect(step3.timeline).toHaveLength(3);
			expect(step3.timeline).toEqual([
				"Caso abierto",
				"En investigación",
				"Finalizado",
			]);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const civicCase = CivicCase.create({ name: "Test" });
			expect(Object.isFrozen(civicCase)).toBe(true);
		});

		it("should return new instance on status change", () => {
			const civicCase = CivicCase.create({ name: "Test" });
			const activated = civicCase.activate();
			expect(activated).not.toBe(civicCase);
		});

		it("should return new instance on add operations", () => {
			const civicCase = CivicCase.create({ name: "Test" });
			const updated = civicCase.addElection("election-1");
			expect(updated).not.toBe(civicCase);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const indicator = FraudIndicator.create({
				type: FraudIndicatorType.ACT_TAMPERING,
				severity: FraudSeverity.CRITICAL,
				description: "Acta adulterada",
				evidence: ["ev-003"],
				detectedAt: new Date("2026-04-12"),
			});

			const civicCase = CivicCase.create({
				name: "Test",
				electionIds: ["election-1"],
				fraudIndicators: [indicator],
				timeline: ["Inicio"],
			});

			const json = civicCase.toJSON();
			expect(json).toHaveProperty("id");
			expect(json.name).toBe("Test");
			expect(json.status).toBe("DRAFT");
			expect(json.electionIds).toEqual(["election-1"]);
			expect(json.fraudIndicators).toHaveLength(1);
			expect(json.timeline).toEqual(["Inicio"]);
			expect(json.fraudIndicators[0]).toHaveProperty("type", "ACT_TAMPERING");
		});
	});
});
