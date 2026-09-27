import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export interface ConsentRecord {
    subjectId: string;
    purposes: readonly string[];
    consentGiven?: boolean;
    expiresAt?: string;
    revokedAt?: string;
    dataCategories?: readonly string[];
    lawfulBasis?: string;
}
export interface ConsentReport {
    validCount: number;
    expiredCount: number;
    revokedCount: number;
    findings: readonly ComplianceFinding[];
}
export declare const consentManagerAgent: Agent<"consent-manager", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const consentManagerPort: AgentPort<Task, ConsentReport>;
//# sourceMappingURL=consent-manager.agent.d.ts.map