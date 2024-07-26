/**
 * FEOS — API Types
 *
 * Request/response schemas for FEOS API endpoints.
 */

import type {
  Actor,
  CompanyRef,
  EvidenceCategory,
  EvidenceItem,
  FiscalScope,
  PeriodRef,
  WorkspaceId,
  WorkspaceIntent,
  WorkspaceState,
  AttentionItem,
  AttentionInbox,
  PortfolioStatus,
  ToolContract,
  ToolRiskLevel,
  AgentEvent,
  EvidenceRoot,
  FeosReceipt,
} from "@drenyra/domain";

// ── Workspace ────────────────────────────────────────────────────────────

export interface CreateWorkspaceBody {
  organizationId: string;
  companyId: string;
  companyRuc: string;
  period: { year: number; month: number };
  intent: string;
  label: string;
  description?: string;
  createdBy: {
    id: string;
    type: string;
    label: string;
  };
  metadata?: Record<string, unknown>;
}

export interface WorkspaceResponse {
  id: WorkspaceId;
  organizationId: string;
  companyId: string;
  period: PeriodRef;
  intent: WorkspaceIntent;
  label: string;
  state: WorkspaceState;
  isHealthy: boolean;
}

export interface TransitionBody {
  action: string;
  params?: Record<string, unknown>;
}

// ── Tool Contracts ───────────────────────────────────────────────────────

export interface ToolContractSummary {
  name: string;
  riskLevel: ToolRiskLevel;
  description: string;
  requiresApproval: boolean;
  idempotent: boolean;
  version: string;
}

export interface ValidateToolCallBody {
  toolName: string;
  riskLevel: ToolRiskLevel;
}

// ── Agent Events ─────────────────────────────────────────────────────────

export interface PublishEventBody {
  kind: string;
  title: string;
  description: string;
  actor: Actor;
  scope: FiscalScope;
  traceId: string;
  workspaceId?: string;
  toolName?: string;
}

// ── Evidence Root ────────────────────────────────────────────────────────

export interface ComputeEvidenceRootBody {
  items: EvidenceItem[];
}

export interface CreateReceiptBody {
  action: string;
  actor: Actor;
  scope: FiscalScope;
  evidenceItems: EvidenceItem[];
  actionInput: unknown;
  actionOutput: unknown;
  previousChainHash?: string;
}
