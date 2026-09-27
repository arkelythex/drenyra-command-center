import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export type RetentionAction = "retain_fiscal_evidence" | "archive" | "delete" | "review";
export interface RetentionPolicy {
    recordId: string;
    action: RetentionAction;
    reason: string;
}
export interface RetentionReport {
    policies: readonly RetentionPolicy[];
    recommendations: readonly string[];
    findings: readonly ComplianceFinding[];
}
export declare const dataRetentionAgent: Agent<"data-retention", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const dataRetentionPort: AgentPort<Task, RetentionReport>;
//# sourceMappingURL=data-retention.agent.d.ts.map