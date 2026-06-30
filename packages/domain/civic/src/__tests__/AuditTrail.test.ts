/**
 * AuditTrail Entity — Unit Tests
 *
 * Spec: id, actId, action, actor, timestamp, evidence[], metadata
 * Append-only — entries cannot be removed or modified
 */
import { describe, expect, it } from "vitest";
import { AuditTrail } from "../entity/AuditTrail";

describe("AuditTrail", () => {
	describe("Creation", () => {
		it("should create with required fields", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "ACT_VALIDATED",
				actor: "system",
				timestamp: new Date("2026-04-12T10:00:00Z"),
			});

			expect(entry.actId).toBe("act-1");
			expect(entry.action).toBe("ACT_VALIDATED");
			expect(entry.actor).toBe("system");
			expect(entry.timestamp).toEqual(new Date("2026-04-12T10:00:00Z"));
			expect(entry.evidence).toEqual([]);
			expect(entry.metadata).toEqual({});
		});

		it("should create with optional evidence and metadata", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "FRAUD_DETECTED",
				actor: "validator-1",
				timestamp: new Date(),
				evidence: ["evidence-hash-001", "evidence-hash-002"],
				metadata: { confidence: 0.85, severity: "HIGH" },
			});

			expect(entry.evidence).toHaveLength(2);
			expect(entry.metadata).toEqual({ confidence: 0.85, severity: "HIGH" });
		});
	});

	describe("Append-Only", () => {
		it("should allow appending evidence", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "ACT_VALIDATED",
				actor: "system",
				timestamp: new Date(),
			});

			const updated = entry.addEvidence("new-evidence-hash");
			expect(updated.evidence).toHaveLength(1);
			expect(updated.evidence[0]).toBe("new-evidence-hash");
		});

		it("should allow adding metadata", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "ACT_VALIDATED",
				actor: "system",
				timestamp: new Date(),
			});

			const updated = entry.addMetadata("key", "value");
			expect(updated.metadata).toEqual({ key: "value" });
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "TEST",
				actor: "system",
				timestamp: new Date(),
			});

			expect(Object.isFrozen(entry)).toBe(true);
		});

		it("should return new instance on addEvidence", () => {
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "TEST",
				actor: "system",
				timestamp: new Date(),
			});

			const updated = entry.addEvidence("hash");
			expect(updated).not.toBe(entry);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const entry = AuditTrail.create({
				actId: "act-1",
				action: "ACT_VALIDATED",
				actor: "system",
				timestamp: date,
				evidence: ["ev-1"],
				metadata: { key: "value" },
			});

			const json = entry.toJSON();
			expect(json.actId).toBe("act-1");
			expect(json.action).toBe("ACT_VALIDATED");
			expect(json.actor).toBe("system");
		});
	});
});
