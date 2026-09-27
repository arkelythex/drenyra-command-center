import type { DrenyraSubagentName } from "./drenyra-subagents";
export declare const AGENT_TIERS: readonly ["tier0", "tier1", "tier2", "tier3", "tier3b"];
export type AgentTier = (typeof AGENT_TIERS)[number];
export declare const AGENT_SYSTEMS: readonly ["cli-delegation", "drenyra-core", "domain-mock", "agent-swarm", "api-agents", "ai-pipeline", "ai-swarm", "erp", "sunat-visual"];
export type AgentSystem = (typeof AGENT_SYSTEMS)[number];
export declare const AGENT_CAPABILITIES: readonly ["document-processing", "ocr", "xml-parsing", "sunat-validation", "bank-reconciliation", "ledger-review", "invoice-processing", "compliance-audit", "code-review", "test-generation", "deployment", "monitoring", "report-generation", "risk-analysis", "evidence-tracking", "tracing", "approval-workflow", "data-sync", "notification", "cost-optimization", "security-audit", "performance-analysis", "migration", "integration", "hr-payroll", "ui-testing", "e2e-testing", "knowledge-retrieval", "task-delegation", "orchestration", "arbitration", "validation", "parsing", "reading", "visual-analysis", "accessibility", "dependency-checking", "schema-validation", "api-design", "database-optimization", "anomaly-detection", "nlp-processing", "data-visualization", "backup-management", "incident-response", "threat-detection", "budget-tracking", "usability-testing", "access-control"];
export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];
export declare const APPROVAL_CLASSES: readonly ["not-required", "supervisor", "financial-controller"];
export type ApprovalClass = (typeof APPROVAL_CLASSES)[number];
export declare const SUPPORTED_SURFACES: readonly ["api", "cli", "web", "workspace", "batch", "automation"];
export type SupportedSurface = (typeof SUPPORTED_SURFACES)[number];
export interface UnifiedAgentEntry {
    id: string;
    name: string;
    system: AgentSystem;
    tier: AgentTier;
    parentId: string | null;
    maySpawn: readonly string[];
    isLeaf: boolean;
    capabilities: readonly AgentCapability[];
    approvalClass: ApprovalClass;
    supportedSurfaces: readonly SupportedSurface[];
    drenyraSubagent: DrenyraSubagentName | null;
    description: string;
    sourcePath: string;
}
export declare function isAgentInTier(entry: UnifiedAgentEntry, tier: AgentTier): boolean;
//# sourceMappingURL=types.d.ts.map