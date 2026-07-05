/**
 * Agent Audit Trail Tests
 * Scenarios: INTERVENIR, ALLOW, Tampering Detection
 */

import { describe, expect, it } from "vitest";
import { createAgentDecisionLog } from "../domain";
import { computeHash, verifyHash } from "../domain/hash.service";

describe("Agent Audit Trail", () => {
	describe("Scenario 1: INTERVENIR decision (exposure > threshold)", () => {
		it("should create immutable log with hash chain", async () => {
			const log = await createAgentDecisionLog({
				organizationId: 1,
				agentName: "compliance-agent",
				agentVersion: "v1.0.0",
				decisionType: "INTERVENIR",
				reasoning: "Exposición supera límite de S/25,000",
				inputs: { exposure: 28400, threshold: 25000 },
				outputs: { action: "liquidate", amount: 5000 },
			});

			expect(log.id).toBeDefined();
			expect(log.hashChain.hash).toHaveLength(64);
			expect(log.hashChain.prevHash).toBeNull(); // Genesis
			expect(log.decisionData.type).toBe("INTERVENIR");
		});
	});

	describe("Scenario 2: ALLOW decision (complies with policy)", () => {
		it("should chain hash to previous log", async () => {
			// First log (genesis)
			const log1 = await createAgentDecisionLog({
				organizationId: 1,
				agentName: "compliance-agent",
				decisionType: "ALLOW",
				inputs: { exposure: 15000, threshold: 25000 },
				outputs: { action: "proceed" },
			});

			// Second log (chained)
			const log2 = await createAgentDecisionLog({
				organizationId: 1,
				agentName: "compliance-agent",
				decisionType: "ALLOW",
				inputs: { exposure: 18000, threshold: 25000 },
				outputs: { action: "proceed" },
				prevHash: log1.hashChain.hash,
			});

			expect(log2.hashChain.prevHash).toBe(log1.hashChain.hash);
			expect(log2.hashChain.isGenesis()).toBe(false);
		});
	});

	describe("Scenario 3: Tampering detection", () => {
		it("should detect hash mismatch (tampering)", async () => {
			const log = await createAgentDecisionLog({
				organizationId: 1,
				agentName: "tax-agent",
				decisionType: "BLOCK",
				inputs: { risk: "high" },
				outputs: { blocked: true },
			});

			// Valid hash
			const validResult = await verifyHash(
				{
					id: log.id,
					createdAt: log.createdAt,
					inputs: log.decisionData.inputs,
					outputs: log.decisionData.outputs,
					prevHash: log.hashChain.prevHash,
				},
				log.hashChain.hash,
			);

			expect(validResult).toBe(true);

			// Tampered hash (simulate attack)
			const tamperedHash = "0".repeat(64);
			const invalidResult = await verifyHash(
				{
					id: log.id,
					createdAt: log.createdAt,
					inputs: log.decisionData.inputs,
					outputs: log.decisionData.outputs,
					prevHash: log.hashChain.prevHash,
				},
				tamperedHash,
			);

			expect(invalidResult).toBe(false);
		});

		it("should detect input tampering", async () => {
			const originalInputs = { exposure: 28400, threshold: 25000 };

			const hash = await computeHash({
				id: "test-id",
				createdAt: new Date("2026-01-15"),
				inputs: originalInputs,
				outputs: { action: "liquidate" },
				prevHash: null,
			});

			// Valid verification
			const validResult = await verifyHash(
				{
					id: "test-id",
					createdAt: new Date("2026-01-15"),
					inputs: originalInputs,
					outputs: { action: "liquidate" },
					prevHash: null,
				},
				hash,
			);

			expect(validResult).toBe(true);

			// Tampered inputs (attacker changes exposure)
			const tamperedInputs = { exposure: 15000, threshold: 25000 };
			const tamperedResult = await verifyHash(
				{
					id: "test-id",
					createdAt: new Date("2026-01-15"),
					inputs: tamperedInputs,
					outputs: { action: "liquidate" },
					prevHash: null,
				},
				hash,
			);

			expect(tamperedResult).toBe(false);
		});
	});

	describe("Hash normalization", () => {
		it("should produce same hash regardless of key order", async () => {
			const inputs1 = { a: 1, b: 2, c: 3 };
			const inputs2 = { c: 3, a: 1, b: 2 };

			const hash1 = await computeHash({
				id: "test",
				createdAt: new Date("2026-01-15"),
				inputs: inputs1,
				outputs: { result: "ok" },
				prevHash: null,
			});

			const hash2 = await computeHash({
				id: "test",
				createdAt: new Date("2026-01-15"),
				inputs: inputs2,
				outputs: { result: "ok" },
				prevHash: null,
			});

			expect(hash1).toBe(hash2);
		});
	});
});
