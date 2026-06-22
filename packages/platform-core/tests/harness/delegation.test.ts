import { describe, expect, it } from "vitest";
import { DelegationGraph } from "../../src/harness/delegation.js";

describe("DelegationGraph", () => {
  it("registers nodes and validates spawn permissions", () => {
    const graph = new DelegationGraph();

    graph.registerNode({
      id: "orchestrator",
      label: "Main orchestrator",
      maySpawn: ["analyst", "compliance"],
    });
    graph.registerNode({
      id: "analyst",
      label: "Analyst agent",
      maySpawn: [],
      parent: "orchestrator",
      leaf: true,
    });
    graph.registerNode({
      id: "compliance",
      label: "Compliance agent",
      maySpawn: [],
      parent: "orchestrator",
      leaf: true,
    });

    expect(graph.canSpawn("orchestrator", "analyst")).toBe(true);
    expect(graph.canSpawn("orchestrator", "compliance")).toBe(true);
    expect(graph.canSpawn("analyst", "orchestrator")).toBe(false);
    expect(graph.canSpawn("orchestrator", "unknown")).toBe(false);
  });

  it("finds path between nodes using BFS", () => {
    const graph = new DelegationGraph();

    graph.registerNode({
      id: "root",
      label: "Root",
      maySpawn: ["mid"],
    });
    graph.registerNode({
      id: "mid",
      label: "Middle",
      maySpawn: ["leaf"],
      parent: "root",
    });
    graph.registerNode({
      id: "leaf",
      label: "Leaf",
      maySpawn: [],
      parent: "mid",
      leaf: true,
    });

    const path = graph.findPath("root", "leaf");
    expect(path.valid).toBe(true);
    expect(path.path).toEqual(["root", "mid", "leaf"]);
  });

  it("returns invalid path when target is unreachable", () => {
    const graph = new DelegationGraph();

    graph.registerNode({
      id: "a",
      label: "A",
      maySpawn: ["b"],
    });
    graph.registerNode({
      id: "b",
      label: "B",
      maySpawn: [],
      parent: "a",
    });

    const path = graph.findPath("a", "c");
    expect(path.valid).toBe(false);
    expect(path.path).toEqual([]);
  });

  it("detects cycles in the graph", () => {
    const graph = new DelegationGraph();

    graph.registerNodes([
      { id: "a", label: "A", maySpawn: ["b"] },
      { id: "b", label: "B", maySpawn: ["c"] },
      { id: "c", label: "C", maySpawn: ["a"] },
    ]);

    expect(graph.hasCycle()).toBe(true);
    const cycle = graph.detectCycle();
    expect(cycle).not.toBeNull();
    expect(cycle!.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null for acyclic graph", () => {
    const graph = new DelegationGraph();

    graph.registerNodes([
      { id: "a", label: "A", maySpawn: ["b", "c"] },
      { id: "b", label: "B", maySpawn: ["d"] },
      { id: "c", label: "C", maySpawn: [] },
      { id: "d", label: "D", maySpawn: [] },
    ]);

    expect(graph.hasCycle()).toBe(false);
    expect(graph.detectCycle()).toBeNull();
  });

  it("returns root and leaf nodes", () => {
    const graph = new DelegationGraph();

    graph.registerNodes([
      { id: "root", label: "Root", maySpawn: ["a", "b"] },
      { id: "a", label: "A", maySpawn: [], parent: "root", leaf: true },
      { id: "b", label: "B", maySpawn: [], parent: "root", leaf: true },
    ]);

    const roots = graph.getRoots();
    expect(roots).toHaveLength(1);
    expect(roots[0]?.id).toBe("root");

    const leaves = graph.getLeaves();
    expect(leaves).toHaveLength(2);
    expect(leaves.map((l) => l.id).sort()).toEqual(["a", "b"]);
  });

  it("allows removing nodes", () => {
    const graph = new DelegationGraph();

    graph.registerNode({
      id: "temp",
      label: "Temporary",
      maySpawn: [],
    });

    expect(graph.getNode("temp")).toBeDefined();
    graph.removeNode("temp");
    expect(graph.getNode("temp")).toBeUndefined();
  });

  it("clears all nodes", () => {
    const graph = new DelegationGraph();

    graph.registerNodes([
      { id: "a", label: "A", maySpawn: ["b"] },
      { id: "b", label: "B", maySpawn: [] },
    ]);

    expect(graph.getAllNodeIds()).toHaveLength(2);
    graph.clear();
    expect(graph.getAllNodeIds()).toHaveLength(0);
  });
});
