import type { DelegationNode, DelegationPath } from "./types.js";
export declare class DelegationGraph {
    private readonly nodes;
    registerNode(node: DelegationNode): void;
    registerNodes(nodes: DelegationNode[]): void;
    getNode(id: string): DelegationNode | undefined;
    removeNode(id: string): boolean;
    canSpawn(parentId: string, childId: string): boolean;
    findPath(from: string, to: string): DelegationPath;
    detectCycle(): string[] | null;
    hasCycle(): boolean;
    getAllNodeIds(): string[];
    getLeaves(): DelegationNode[];
    getRoots(): DelegationNode[];
    clear(): void;
}
//# sourceMappingURL=delegation.d.ts.map