/**
 * Characterization tests for DelegationGraph.
 *
 * These tests capture current behavior BEFORE migration to Pi SDK.
 * They serve as parity contracts for the post-migration delegation policy compiler.
 *
 * @module @drenyra/pi/harness-core
 */

import { describe, expect, it } from "vitest";
import { DelegationGraph } from "../delegation";

describe("DelegationGraph — characterization", () => {
	it("should register a node and retrieve it", () => {
		const graph = new DelegationGraph();
		graph.registerNode({
			id: "orchestrator",
			label: "Main orchestrator",
			maySpawn: ["analyst", "compliance"],
		});

		const node = graph.getNode("orchestrator");
		expect(node).toBeDefined();
		expect(node?.id).toBe("orchestrator");
		expect(node?.maySpawn).toEqual(["analyst", "compliance"]);
	});

	it("should return undefined for unknown node", () => {
		const graph = new DelegationGraph();
		expect(graph.getNode("nonexistent")).toBeUndefined();
	});

	it("should check spawn permissions correctly", () => {
		const graph = new DelegationGraph();
		graph.registerNode({
			id: "parent",
			label: "Parent",
			maySpawn: ["child-a", "child-b"],
		});

		expect(graph.canSpawn("parent", "child-a")).toBe(true);
		expect(graph.canSpawn("parent", "child-b")).toBe(true);
		expect(graph.canSpawn("parent", "child-c")).toBe(false);
	});

	it("should return false when parent does not exist", () => {
		const graph = new DelegationGraph();
		expect(graph.canSpawn("unknown", "anything")).toBe(false);
	});

	it("should register multiple nodes at once", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "a", label: "A", maySpawn: ["b"] },
			{ id: "b", label: "B", maySpawn: ["c"] },
			{ id: "c", label: "C", maySpawn: [] },
		]);

		expect(graph.getAllNodeIds()).toEqual(["a", "b", "c"]);
	});

	it("should find path between connected nodes", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "root", label: "Root", maySpawn: ["orchestrator"] },
			{ id: "orchestrator", label: "Orch", maySpawn: ["analyst", "compliance"] },
			{ id: "analyst", label: "Analyst", maySpawn: [], leaf: true },
			{ id: "compliance", label: "Compliance", maySpawn: [], leaf: true },
		]);

		const path = graph.findPath("root", "analyst");
		expect(path.valid).toBe(true);
		expect(path.path).toEqual(["root", "orchestrator", "analyst"]);
	});

	it("should return direct path when from equals to", () => {
		const graph = new DelegationGraph();
		graph.registerNode({ id: "self", label: "Self", maySpawn: [] });

		const path = graph.findPath("self", "self");
		expect(path.valid).toBe(true);
		expect(path.path).toEqual(["self"]);
	});

	it("should return invalid path when nodes are disconnected", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "a", label: "A", maySpawn: ["b"] },
			{ id: "b", label: "B", maySpawn: [] },
			{ id: "c", label: "C", maySpawn: [] },
		]);

		const path = graph.findPath("a", "c");
		expect(path.valid).toBe(false);
		expect(path.path).toEqual([]);
	});

	it("should detect cycles in the graph", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "a", label: "A", maySpawn: ["b"] },
			{ id: "b", label: "B", maySpawn: ["c"] },
			{ id: "c", label: "C", maySpawn: ["a"] }, // cycle!
		]);

		const cycle = graph.detectCycle();
		expect(cycle).not.toBeNull();
		expect(cycle!.length).toBeGreaterThanOrEqual(2);
		expect(graph.hasCycle()).toBe(true);
	});

	it("should detect no cycles in an acyclic graph", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "a", label: "A", maySpawn: ["b"] },
			{ id: "b", label: "B", maySpawn: ["c"] },
			{ id: "c", label: "C", maySpawn: [] },
		]);

		expect(graph.hasCycle()).toBe(false);
		expect(graph.detectCycle()).toBeNull();
	});

	it("should get root nodes (no parent)", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "root", label: "Root", maySpawn: ["child"], parent: undefined },
			{ id: "child", label: "Child", maySpawn: [], parent: "root" },
		]);

		const roots = graph.getRoots();
		expect(roots).toHaveLength(1);
		expect(roots[0].id).toBe("root");
	});

	it("should get leaf nodes", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "root", label: "Root", maySpawn: ["leaf1", "leaf2"] },
			{ id: "leaf1", label: "Leaf 1", maySpawn: [], leaf: true },
			{ id: "leaf2", label: "Leaf 2", maySpawn: [] },
		]);

		const leaves = graph.getLeaves();
		expect(leaves).toHaveLength(2);
	});

	it("should remove a node", () => {
		const graph = new DelegationGraph();
		graph.registerNode({ id: "temp", label: "Temp", maySpawn: [] });

		expect(graph.getNode("temp")).toBeDefined();
		expect(graph.removeNode("temp")).toBe(true);
		expect(graph.getNode("temp")).toBeUndefined();
	});

	it("should return false when removing non-existent node", () => {
		const graph = new DelegationGraph();
		expect(graph.removeNode("nonexistent")).toBe(false);
	});

	it("should clear all nodes", () => {
		const graph = new DelegationGraph();
		graph.registerNodes([
			{ id: "a", label: "A", maySpawn: [] },
			{ id: "b", label: "B", maySpawn: [] },
		]);

		graph.clear();
		expect(graph.getAllNodeIds()).toHaveLength(0);
	});
});
