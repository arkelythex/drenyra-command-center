import type { AgentContext } from "../types/agent-context";
export interface TaskStep {
    id: string;
    goal: string;
    domain: string;
    tools: string[];
    dependencies: string[];
}
export interface TaskDecompositionResult {
    goal: string;
    steps: TaskStep[];
    parallelGroups: string[][];
}
export declare class TaskDecomposer {
    decompose(goal: string, _context: AgentContext, availableDomains: string[]): TaskDecompositionResult;
}
//# sourceMappingURL=task-decomposer.d.ts.map