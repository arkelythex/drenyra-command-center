import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export type GDPRStatus = "pass" | "partial" | "fail" | "exception";
export type GDPRSeverity = "low" | "medium" | "high" | "critical";
export interface GDPRCheck {
    requirement: string;
    status: GDPRStatus;
    detail: string;
}
export interface GDPRViolation {
    requirement: string;
    severity: GDPRSeverity;
    detail: string;
}
export interface GDPRReport {
    checks: readonly GDPRCheck[];
    violations: readonly GDPRViolation[];
    findings: readonly ComplianceFinding[];
    score: number;
}
export declare const gdprCheckerAgent: Agent<"gdpr-checker", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const gdprCheckerPort: AgentPort<Task, GDPRReport>;
//# sourceMappingURL=gdpr-checker.agent.d.ts.map