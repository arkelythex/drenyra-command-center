import { describe, it, expect } from "vitest";
import { AGENT_REGISTRY, getAgentById, getAgentsBySystem, getAgentsByTier, getLeafAgents, getRootAgents, getDrenyraSubagents } from "../registry";
import { AGENT_TIERS, AGENT_SYSTEMS, isAgentInTier } from "../types";

describe("Unified Agent Registry", () => {
	it("should have at least 50 entries", () => {
		expect(AGENT_REGISTRY.length).toBeGreaterThanOrEqual(50);
	});

	it("should have no duplicate IDs", () => {
		const ids = AGENT_REGISTRY.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("every entry should have a valid tier", () => {
		for (const entry of AGENT_REGISTRY) {
			expect(AGENT_TIERS.includes(entry.tier)).toBe(true);
		}
	});

	it("every entry should have a valid system", () => {
		for (const entry of AGENT_REGISTRY) {
			expect(AGENT_SYSTEMS.includes(entry.system)).toBe(true);
		}
	});

	it("every entry should have a non-empty id, name, and description", () => {
		for (const entry of AGENT_REGISTRY) {
			expect(entry.id).toBeTruthy();
			expect(entry.name).toBeTruthy();
			expect(entry.description).toBeTruthy();
		}
	});

	it("parentId should reference existing entry or be null", () => {
		const ids = new Set(AGENT_REGISTRY.map((a) => a.id));
		for (const entry of AGENT_REGISTRY) {
			if (entry.parentId !== null) {
				expect(ids.has(entry.parentId)).toBe(true);
			}
		}
	});

	it("maySpawn entries should reference existing IDs", () => {
		const ids = new Set(AGENT_REGISTRY.map((a) => a.id));
		for (const entry of AGENT_REGISTRY) {
			for (const spawnId of entry.maySpawn) {
				expect(ids.has(spawnId)).toBe(true);
			}
		}
	});

	it("should have consistent isLeaf with maySpawn", () => {
		for (const entry of AGENT_REGISTRY) {
			if (entry.maySpawn.length > 0) {
				// Non-leaf agents may spawn
				expect(entry.isLeaf).toBe(false);
			}
		}
	});

	it("every entry should have valid capabilities", () => {
		for (const entry of AGENT_REGISTRY) {
			expect(Array.isArray(entry.capabilities)).toBe(true);
			expect(entry.capabilities.length).toBeGreaterThan(0);
		}
	});

	it("should have drenyra-core agents with correct drenyraSubagent mapping", () => {
		const coreAgents = getAgentsBySystem("drenyra-core");
		expect(coreAgents.length).toBe(8);
		for (const agent of coreAgents) {
			expect(agent.drenyraSubagent).not.toBeNull();
		}
	});

	it("getAgentById returns correct agent", () => {
		const agent = getAgentById("eviden");
		expect(agent).toBeDefined();
		expect(agent!.name).toBe("Eviden");
	});

	it("getAgentById returns undefined for unknown ID", () => {
		expect(getAgentById("nonexistent")).toBeUndefined();
	});

	it("getAgentsBySystem returns correct count for known systems", () => {
		const cliAgents = getAgentsBySystem("cli-delegation");
		expect(cliAgents.length).toBeGreaterThanOrEqual(14);
		const coreAgents = getAgentsBySystem("drenyra-core");
		expect(coreAgents.length).toBe(8);
	});

	it("getAgentsBySystem returns empty for unknown system", () => {
		const result = getAgentsBySystem("unknown" as never);
		expect(result).toEqual([]);
	});

	it("getAgentsByTier returns agents filtered by tier", () => {
		const tier3Agents = getAgentsByTier("tier3");
		expect(tier3Agents.length).toBeGreaterThan(0);
	});

	it("getLeafAgents returns only leaf agents", () => {
		const leaves = getLeafAgents();
		expect(leaves.length).toBeGreaterThan(0);
		for (const leaf of leaves) {
			expect(leaf.isLeaf).toBe(true);
		}
	});

	it("getRootAgents returns agents with null parentId", () => {
		const roots = getRootAgents();
		expect(roots.length).toBeGreaterThan(0);
		for (const root of roots) {
			expect(root.parentId).toBeNull();
		}
	});

	it("getDrenyraSubagents returns agents with drenyraSubagent mapping", () => {
		const subagents = getDrenyraSubagents();
		expect(subagents.length).toBeGreaterThanOrEqual(8);
		for (const a of subagents) {
			expect(a.drenyraSubagent).not.toBeNull();
		}
	});

	it("isAgentInTier type guard works correctly", () => {
		const entry = getAgentById("arkelythex-orchestrator")!;
		expect(isAgentInTier(entry, "tier0")).toBe(true);
		expect(isAgentInTier(entry, "tier1")).toBe(false);
	});
});
