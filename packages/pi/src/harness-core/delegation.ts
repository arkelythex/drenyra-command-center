/**
 * Delegation Graph — domain-agnostic agent hierarchy.
 *
 * A directed graph of agent nodes defining spawn permissions.
 * Supports dynamic node registration, path finding, and cycle detection.
 *
 * Zero fiscal imports — no hardcoded agent types or keyword matching.
 * All agent IDs and routing are provided by the caller.
 *
 * @module @drenyra/platform-core/harness
 */

import type { DelegationNode, DelegationPath } from "./types.js";

/**
 * Domain-agnostic delegation graph.
 *
 * Agents register as nodes with spawn permissions.
 * The graph enforces parent-child relationships and detects cycles.
 *
 * @example
 * ```ts
 * const graph = new DelegationGraph();
 * graph.registerNode({
 *   id: "orchestrator",
 *   label: "Main orchestrator",
 *   maySpawn: ["analyst", "compliance"],
 * });
 * graph.registerNode({
 *   id: "analyst",
 *   label: "Analyst agent",
 *   maySpawn: [],
 *   parent: "orchestrator",
 *   leaf: true,
 * });
 *
 * graph.canSpawn("orchestrator", "analyst"); // true
 * graph.findPath("orchestrator", "analyst");  // ["orchestrator", "analyst"]
 * ```
 */
export class DelegationGraph {
	private readonly nodes = new Map<string, DelegationNode>();

	/**
	 * Register or update an agent node in the graph.
	 */
	registerNode(node: DelegationNode): void {
		this.nodes.set(node.id, node);
	}

	/**
	 * Register multiple nodes at once.
	 */
	registerNodes(nodes: DelegationNode[]): void {
		for (const node of nodes) {
			this.nodes.set(node.id, node);
		}
	}

	/**
	 * Get a registered node by ID.
	 */
	getNode(id: string): DelegationNode | undefined {
		return this.nodes.get(id);
	}

	/**
	 * Remove a node from the graph.
	 */
	removeNode(id: string): boolean {
		return this.nodes.delete(id);
	}

	/**
	 * Check if a parent agent is allowed to spawn a child agent.
	 */
	canSpawn(parentId: string, childId: string): boolean {
		const parent = this.nodes.get(parentId);
		if (parent === undefined) return false;
		return parent.maySpawn.includes(childId);
	}

	/**
	 * Find the shortest path from one node to another through the graph.
	 * Uses BFS to find the most direct delegation chain.
	 *
	 * Returns the path if one exists, or an invalid path if unreachable.
	 */
	findPath(from: string, to: string): DelegationPath {
		if (from === to) {
			return { path: [from], valid: true };
		}

		const fromNode = this.nodes.get(from);
		if (fromNode === undefined) {
			return { path: [], valid: false };
		}

		// BFS
		const visited = new Set<string>();
		const queue: { nodeId: string; path: string[] }[] = [
			{ nodeId: from, path: [from] },
		];
		visited.add(from);

		while (queue.length > 0) {
			const { nodeId, path } = queue.shift()!;
			const node = this.nodes.get(nodeId);
			if (node === undefined) continue;

			for (const childId of node.maySpawn) {
				if (childId === to) {
					return { path: [...path, childId], valid: true };
				}

				if (!visited.has(childId)) {
					visited.add(childId);
					queue.push({ nodeId: childId, path: [...path, childId] });
				}
			}
		}

		return { path: [], valid: false };
	}

	/**
	 * Detect if the graph has any cycles using DFS.
	 * Returns the first cycle found, or null if the graph is acyclic.
	 */
	detectCycle(): string[] | null {
		const WHITE = 0; // unvisited
		const GRAY = 1; // in current DFS path
		const BLACK = 2; // fully explored

		const color = new Map<string, number>();
		const parent = new Map<string, string | null>();

		for (const id of this.nodes.keys()) {
			color.set(id, WHITE);
			parent.set(id, null);
		}

		for (const startId of this.nodes.keys()) {
			if (color.get(startId) !== WHITE) continue;

			const stack: { id: string; iterator: Iterator<string> }[] = [];
			const initialIter = this.nodes.get(startId)!.maySpawn[Symbol.iterator]();
			color.set(startId, GRAY);
			stack.push({ id: startId, iterator: initialIter });

			while (stack.length > 0) {
				const frame = stack[stack.length - 1];
				if (frame === undefined) break;
				const result = frame.iterator.next();

				if (result.done) {
					color.set(frame.id, BLACK);
					stack.pop();
					continue;
				}

				const neighbor = result.value;

				if (color.get(neighbor) === GRAY) {
					// Cycle found — reconstruct
					const cycle: string[] = [neighbor, frame.id];
					let current = frame.id;
					while (current !== neighbor) {
						const p = parent.get(current);
						if (p === null || p === undefined) break;
						cycle.push(p);
						current = p;
					}
					return cycle.reverse();
				}

				if (color.get(neighbor) === WHITE) {
					const neighborNode = this.nodes.get(neighbor);
					if (neighborNode !== undefined) {
						parent.set(neighbor, frame.id);
						color.set(neighbor, GRAY);
						stack.push({
							id: neighbor,
							iterator: neighborNode.maySpawn[Symbol.iterator](),
						});
					}
				}
			}
		}

		return null;
	}

	/**
	 * Check if the graph has any cycles.
	 */
	hasCycle(): boolean {
		return this.detectCycle() !== null;
	}

	/**
	 * Get all registered node IDs.
	 */
	getAllNodeIds(): string[] {
		return [...this.nodes.keys()];
	}

	/**
	 * Get all leaf nodes (nodes that cannot spawn further).
	 */
	getLeaves(): DelegationNode[] {
		return [...this.nodes.values()].filter(
			(node) => node.leaf || node.maySpawn.length === 0,
		);
	}

	/**
	 * Get all root nodes (nodes that have no parent).
	 */
	getRoots(): DelegationNode[] {
		return [...this.nodes.values()].filter((node) => node.parent === undefined);
	}

	/**
	 * Clear all registered nodes.
	 */
	clear(): void {
		this.nodes.clear();
	}
}
