import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export interface PrivacyReport {
    privacyRiskScore: number;
    classifications: readonly string[];
    recommendations: readonly string[];
    findings: readonly ComplianceFinding[];
}
export declare const privacyAssessorAgent: Agent<"privacy-assessor", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const privacyAssessorPort: AgentPort<Task, PrivacyReport>;
//# sourceMappingURL=privacy-assessor.agent.d.ts.map