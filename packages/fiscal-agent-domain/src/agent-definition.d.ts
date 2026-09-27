import type { RiskTier } from "./risk-tier";
import type { ApprovalLevel } from "./approval-policy";
import type { Jurisdiction } from "./risk-tier";
export interface AgentCapability {
    id: string;
    description: string;
}
export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    riskTier: RiskTier;
    jurisdictions: Jurisdiction[];
    capabilities: AgentCapability[];
    forbiddenCapabilities: string[];
    approvalLevel: ApprovalLevel;
    parentId: string | null;
    maySpawn: readonly string[];
    isLeaf: boolean;
    sourcePath?: string;
}
//# sourceMappingURL=agent-definition.d.ts.map