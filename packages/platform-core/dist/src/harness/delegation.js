export class DelegationGraph {
    nodes = new Map();
    registerNode(node) {
        this.nodes.set(node.id, node);
    }
    registerNodes(nodes) {
        for (const node of nodes) {
            this.nodes.set(node.id, node);
        }
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    removeNode(id) {
        return this.nodes.delete(id);
    }
    canSpawn(parentId, childId) {
        const parent = this.nodes.get(parentId);
        if (parent === undefined)
            return false;
        return parent.maySpawn.includes(childId);
    }
    findPath(from, to) {
        if (from === to) {
            return { path: [from], valid: true };
        }
        const fromNode = this.nodes.get(from);
        if (fromNode === undefined) {
            return { path: [], valid: false };
        }
        const visited = new Set();
        const queue = [
            { nodeId: from, path: [from] },
        ];
        visited.add(from);
        while (queue.length > 0) {
            const { nodeId, path } = queue.shift();
            const node = this.nodes.get(nodeId);
            if (node === undefined)
                continue;
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
    detectCycle() {
        const WHITE = 0;
        const GRAY = 1;
        const BLACK = 2;
        const color = new Map();
        const parent = new Map();
        for (const id of this.nodes.keys()) {
            color.set(id, WHITE);
            parent.set(id, null);
        }
        for (const startId of this.nodes.keys()) {
            if (color.get(startId) !== WHITE)
                continue;
            const stack = [];
            const initialIter = this.nodes.get(startId).maySpawn[Symbol.iterator]();
            color.set(startId, GRAY);
            stack.push({ id: startId, iterator: initialIter });
            while (stack.length > 0) {
                const frame = stack[stack.length - 1];
                const result = frame.iterator.next();
                if (result.done) {
                    color.set(frame.id, BLACK);
                    stack.pop();
                    continue;
                }
                const neighbor = result.value;
                if (color.get(neighbor) === GRAY) {
                    const cycle = [neighbor, frame.id];
                    let current = frame.id;
                    while (current !== neighbor) {
                        const p = parent.get(current);
                        if (p === null || p === undefined)
                            break;
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
    hasCycle() {
        return this.detectCycle() !== null;
    }
    getAllNodeIds() {
        return [...this.nodes.keys()];
    }
    getLeaves() {
        return [...this.nodes.values()].filter((node) => node.leaf || node.maySpawn.length === 0);
    }
    getRoots() {
        return [...this.nodes.values()].filter((node) => node.parent === undefined);
    }
    clear() {
        this.nodes.clear();
    }
}
//# sourceMappingURL=delegation.js.map