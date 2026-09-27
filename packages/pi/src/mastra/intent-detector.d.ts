import type { AgentContext } from "../types/agent-context";
import type { AgentId, AgentIntent } from "../types/erp-types";
export interface IntentRule {
    pattern: RegExp;
    agent: AgentId;
    tool: string;
    priority: number;
}
export type IntentHandler = (input: string, context: AgentContext) => Promise<AgentIntent>;
export declare class IntentDetector {
    private rules;
    constructor();
    register(rule: IntentRule): void;
    detectIntent(input: string, _context: AgentContext): Promise<AgentIntent>;
    private registerDefaultRules;
    getRules(): IntentRule[];
}
//# sourceMappingURL=intent-detector.d.ts.map