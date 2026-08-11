/**
 * FEOS — API Controller
 *
 * Controllers for FEOS workspace, attention, tool contract, and evidence receipt endpoints.
 * These work as in-memory/system-level controllers for the FEOS domain types.
 * Production implementations would use persistence repositories.
 */

import {
  type Actor,
  type FiscalScope,
  type PeriodRef,
  type WorkspaceProps,
  type WorkspaceId,
  type CompanyId,
  type OrganizationId,
  type ToolContractRegistry,
  type ToolRiskLevel,
  type EvidenceItem,
  type EvidenceRoot,
  Workspace,
  buildAttentionInbox,
  buildPortfolioStatus,
  registerDrenyraContracts,
  getContract,
  validateToolCall,
  createEvidenceRoot,
  verifyEvidenceRoot,
  createFeosReceipt,
  verifyFeosReceipt,
  generateId,
} from "@drenyra/domain";

// In-memory agent event bus (FEOS-007)
import type { AgentEvent } from "@drenyra/domain";
import { projectWorkflowState } from "@drenyra/domain";

// ============================================================================
// In-memory Store (replace with DB repositories in production)
// ============================================================================

class WorkspaceStore {
  private workspaces: Map<string, Workspace> = new Map();

  all(): WorkspaceProps[] {
    return Array.from(this.workspaces.values()).map((w) => w.toProps());
  }

  get(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  set(workspace: Workspace): void {
    this.workspaces.set(workspace.id, workspace);
  }

  listByCompany(companyId: string): WorkspaceProps[] {
    return this.all().filter((w) => w.companyId === companyId);
  }

  listByPeriod(companyId: string, year: number, month: number): WorkspaceProps[] {
    return this.all().filter(
      (w) => w.companyId === companyId && w.period.year === year && w.period.month === month,
    );
  }
}

const workspaceStore = new WorkspaceStore();
// Simple in-memory event store
const events: AgentEvent[] = [];
const eventStore = {
  publish(event: AgentEvent): void {
    events.push(event);
  },
  getWorkspaceEvents(workspaceId: string, limit = 50): AgentEvent[] {
    return events.filter((e) => e.workspaceId === workspaceId).slice(-limit);
  },
  getTraceEvents(traceId: string): AgentEvent[] {
    return events.filter((e) => e.traceId === traceId);
  },
  getLatestEvent(workspaceId: string): AgentEvent | undefined {
    const wsEvents = events.filter((e) => e.workspaceId === workspaceId);
    return wsEvents.length > 0 ? wsEvents[wsEvents.length - 1] : undefined;
  },
  projectWorkflow(workspaceId: string) {
    const wsEvents = this.getWorkspaceEvents(workspaceId);
    if (wsEvents.length === 0) return null;
    return projectWorkflowState(wsEvents);
  },
};
const toolRegistry: ToolContractRegistry = registerDrenyraContracts();
const evidenceRoots: Map<string, EvidenceRoot> = new Map();

// ============================================================================
// Controller
// ============================================================================

export const feosController = {
  // ── Workspace ──────────────────────────────────────────────────────────

  createWorkspace(input: {
    organizationId: string;
    companyId: string;
    companyRuc: string;
    period: { year: number; month: number };
    intent: string;
    label: string;
    description?: string;
    createdBy: { id: string; type: string; label: string };
    metadata?: Record<string, unknown>;
  }) {
    const workspace = Workspace.create({
      organizationId: input.organizationId as any,
      companyId: input.companyId as any,
      companyRuc: input.companyRuc,
      period: { year: input.period.year, month: input.period.month, label: "" } as PeriodRef,
      intent: input.intent as any,
      label: input.label,
      ...(input.description !== undefined ? { description: input.description } : {}),
      createdBy: input.createdBy as Actor,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    });

    workspaceStore.set(workspace);

    return {
      id: workspace.id,
      organizationId: workspace.organizationId,
      companyId: workspace.companyId,
      period: workspace.period,
      intent: workspace.intent,
      label: workspace.label,
      state: workspace.state,
      isHealthy: workspace.isHealthy,
    };
  },

  getWorkspace(id: string) {
    const ws = workspaceStore.get(id);
    if (!ws) {
      return { error: "Workspace not found", code: "WORKSPACE_NOT_FOUND" };
    }
    return ws.toProps();
  },

  listWorkspaces(companyId?: string) {
    const workspaces = companyId
      ? workspaceStore.listByCompany(companyId)
      : workspaceStore.all();
    return { workspaces, count: workspaces.length };
  },

  transitionWorkspace(id: string, action: string, params?: Record<string, unknown>) {
    let ws = workspaceStore.get(id);
    if (!ws) {
      return { error: "Workspace not found", code: "WORKSPACE_NOT_FOUND" };
    }

    try {
      switch (action) {
        case "start":
          ws = ws.start();
          break;
        case "verify":
          ws = ws.verify();
          break;
        case "complete":
          ws = ws.markCompleted();
          break;
        case "fail":
          ws = ws.markFailed(params?.error as string);
          break;
        case "block":
          ws = ws.block(
            params?.reason as string ?? "No reason",
            (params?.blockedBy as WorkspaceId[] | undefined) ?? [],
            params?.actor as Actor | undefined,
          );
          break;
        case "unblock":
          ws = ws.unblock();
          break;
        case "wait-approval":
          ws = ws.waitForApproval();
          break;
        case "wait-evidence":
          ws = ws.waitForEvidence();
          break;
        default:
          return { error: `Unknown action: ${action}`, code: "UNKNOWN_ACTION" };
      }
      workspaceStore.set(ws);
      return { id: ws.id, state: ws.state, isHealthy: ws.isHealthy };
    } catch (err: any) {
      return { error: err.message, code: err.code ?? "TRANSITION_ERROR" };
    }
  },

  // ── Portfolio / Attention ──────────────────────────────────────────────

  getPortfolioStatus(organizationId: string) {
    const all = workspaceStore.all();
    const companies = new Map<CompanyId, { companyId: CompanyId; companyRuc: string; companyName: string; workspaces: WorkspaceProps[] }>();

    for (const ws of all) {
      const key = ws.companyId;
      if (!companies.has(key)) {
        companies.set(key, {
          companyId: ws.companyId,
          companyRuc: ws.companyRuc,
          companyName: `Company ${ws.companyRuc}`,
          workspaces: [],
        });
      }
      companies.get(key)!.workspaces.push(ws);
    }

    const status = buildPortfolioStatus({
      organizationId: organizationId as any,
      companies: Array.from(companies.values()),
    });

    return status;
  },

  getAttentionInbox(organizationId: string) {
    const all = workspaceStore.all();
    const rollup = buildAttentionInbox({
      portfolioId: generateId() as any,
      organizationId: organizationId as any,
      workspaces: all,
    });
    return rollup;
  },

  // ── Tool Contracts ─────────────────────────────────────────────────────

  listToolContracts() {
    return Array.from(toolRegistry.entries()).map(([, contract]) => ({
      name: contract.name,
      riskLevel: contract.riskLevel,
      description: contract.description,
      requiresApproval: contract.requiresApproval,
      idempotent: contract.idempotent,
      version: contract.version,
    }));
  },

  getToolContract(name: string) {
    try {
      const contract = getContract(toolRegistry, name);
      return contract;
    } catch {
      return { error: `Tool contract "${name}" not found`, code: "CONTRACT_NOT_FOUND" };
    }
  },

  validateToolCall(toolName: string, riskLevel: string) {
    try {
      const contract = getContract(toolRegistry, toolName);
      const result = validateToolCall(contract, {
        toolName,
        riskLevel: riskLevel as ToolRiskLevel,
        contractVersion: contract.version,
        input: {},
        actor: { id: "system", type: "system", label: "System validation" },
        scope: { organizationId: "unknown" as OrganizationId, companyId: "unknown" as CompanyId, companyRuc: "00000000000", fiscalPeriod: "2026-01" },
        traceId: "validation",
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (err: any) {
      return { passed: false, errors: [{ field: "contract", message: err.message, code: err.code ?? "UNKNOWN" }], warnings: [] };
    }
  },

  // ── Agent Events ───────────────────────────────────────────────────────

  publishEvent(event: {
    kind: string;
    title: string;
    description: string;
    actor: { id: string; type: string; label: string };
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName?: string;
  }) {
    const feosEvent: AgentEvent = {
      id: generateId(),
      kind: event.kind as any,
      severity: "info" as const,
      title: event.title,
      description: event.description,
      actor: event.actor as Actor,
      scope: event.scope,
      timestamp: { iso: new Date().toISOString(), unix: Date.now() },
      traceId: event.traceId,
      ...(event.workspaceId !== undefined ? { workspaceId: event.workspaceId } : {}),
      ...(event.toolName !== undefined ? { toolName: event.toolName } : {}),
      tags: [],
    };

    eventStore.publish(feosEvent);
    return { eventId: feosEvent.id };
  },

  getWorkspaceEvents(workspaceId: string) {
    return eventStore.getWorkspaceEvents(workspaceId);
  },

  getEventTrace(traceId: string) {
    return eventStore.getTraceEvents(traceId);
  },

  projectWorkflow(workspaceId: string) {
    return eventStore.projectWorkflow(workspaceId);
  },

  // ── Evidence Root ──────────────────────────────────────────────────────

  computeEvidenceRoot(items: EvidenceItem[]) {
    const root = createEvidenceRoot({
      items,
      computedBy: { id: "system", type: "system", label: "API" },
      scope: { organizationId: "unknown" as OrganizationId, companyId: "unknown" as CompanyId, companyRuc: "00000000000", fiscalPeriod: "2026-01" },
    });
    evidenceRoots.set(root.id, root);
    return root;
  },

  verifyEvidenceRoot(id: string) {
    const root = evidenceRoots.get(id);
    if (!root) return { valid: false, errors: ["Evidence root not found"] };
    return verifyEvidenceRoot(root);
  },

  createReceipt(input: {
    action: string;
    actor: Actor;
    scope: FiscalScope;
    evidenceItems: EvidenceItem[];
    actionInput: unknown;
    actionOutput: unknown;
    previousChainHash?: string;
  }) {
    const receipt = createFeosReceipt({
      receiptId: generateId(),
      action: input.action,
      actor: input.actor,
      scope: input.scope,
      evidenceItems: input.evidenceItems,
      actionInput: input.actionInput,
      actionOutput: input.actionOutput,
      ...(input.previousChainHash !== undefined ? { previousChainHash: input.previousChainHash } : {}),
    });
    return receipt;
  },

  verifyReceipt(receipt: Parameters<typeof verifyFeosReceipt>[0]) {
    return verifyFeosReceipt(receipt);
  },
};
