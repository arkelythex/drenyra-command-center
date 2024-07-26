/**
 * Drenyra Orchestrator — FEOS Agent Event Bus
 *
 * Event bus for agent events that projects them onto workspace state.
 * Maps Pi agent events → Drenyra Agent Events → Workspace projections.
 *
 * @module @drenyra/orchestrator/feos/agent-event-bus
 */

import type { AgentEvent } from "@drenyra/domain";
import { createToolEvent, createWorkflowEvent, createApprovalEvent, projectWorkflowState } from "@drenyra/domain";
import type { Actor, FiscalScope } from "@drenyra/domain";

// ============================================================================
// Event Bus Types
// ============================================================================

export type EventHandler = (event: AgentEvent) => void | Promise<void>;
export type EventSubscription = { kind: string; handler: EventHandler };

// ============================================================================
// Agent Event Bus
// ============================================================================

export class AgentEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private history: AgentEvent[] = [];
  private maxHistory: number;

  constructor(maxHistory = 10_000) {
    this.maxHistory = maxHistory;
  }

  /**
   * Subscribe to all events matching a kind pattern.
   * "*" subscribes to all events.
   */
  subscribe(kind: string | "*", handler: EventHandler): () => void {
    const key = kind === "*" ? "*" : kind;
    const existing = this.handlers.get(key) ?? [];
    existing.push(handler);
    this.handlers.set(key, existing);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(key);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    };
  }

  /**
   * Publish an event to all matching subscribers.
   */
  async publish(event: AgentEvent): Promise<void> {
    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Notify kind-specific handlers
    const kindHandlers = this.handlers.get(event.kind) ?? [];
    const allHandlers = this.handlers.get("*") ?? [];

    const all = [...kindHandlers, ...allHandlers];
    await Promise.all(all.map((h) => Promise.resolve(h(event))));
  }

  /**
   * Get event history for a workspace.
   */
  getWorkspaceEvents(workspaceId: string, limit = 50): AgentEvent[] {
    return this.history
      .filter((e) => e.workspaceId === workspaceId)
      .slice(-limit);
  }

  /**
   * Get event history for a trace.
   */
  getTraceEvents(traceId: string): AgentEvent[] {
    return this.history.filter((e) => e.traceId === traceId);
  }

  /**
   * Get all events in history.
   */
  getAllEvents(limit = 100): AgentEvent[] {
    return this.history.slice(-limit);
  }

  /**
   * Get the latest event for a workspace.
   */
  getLatestEvent(workspaceId: string): AgentEvent | undefined {
    const events = this.history.filter((e) => e.workspaceId === workspaceId);
    return events.length > 0 ? events[events.length - 1] : undefined;
  }

  /**
   * Project workflow state from events for a workspace.
   */
  projectWorkflow(workspaceId: string) {
    const events = this.getWorkspaceEvents(workspaceId);
    if (events.length === 0) return null;
    return projectWorkflowState(events);
  }

  /**
   * Clear event history.
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Number of events in history.
   */
  get size(): number {
    return this.history.length;
  }
}

// ============================================================================
// Event Factory — creates FEOS events from Pi-style agent lifecycle
// ============================================================================

export class AgentEventFactory {
  /**
   * Creates a tool-started event.
   */
  static toolStarted(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    toolRiskLevel?: string;
    input: unknown;
  }): AgentEvent {
    return createToolEvent({
      kind: "tool_started",
      title: `Running: ${input.toolName}`,
      description: `Agent started executing tool "${input.toolName}"`,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      toolRiskLevel: input.toolRiskLevel as any,
      payload: { input: input.input },
    });
  }

  /**
   * Creates a tool-progress event with current/total tracking.
   */
  static toolProgress(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    current: number;
    total: number;
    label: string;
  }): AgentEvent {
    return createToolEvent({
      kind: "tool_progress",
      title: `Progress: ${input.toolName}`,
      description: input.label,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      progress: { current: input.current, total: input.total, label: input.label },
    });
  }

  /**
   * Creates a tool-completed event with output.
   */
  static toolCompleted(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    output: unknown;
    durationMs?: number;
  }): AgentEvent {
    return createToolEvent({
      kind: "tool_completed",
      title: `Completed: ${input.toolName}`,
      description: `Tool "${input.toolName}" completed successfully`,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      payload: { output: input.output, durationMs: input.durationMs },
    });
  }

  /**
   * Creates a tool-error event.
   */
  static toolError(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    error: string;
  }): AgentEvent {
    return createToolEvent({
      kind: "tool_error",
      title: `Error: ${input.toolName}`,
      description: `Tool "${input.toolName}" failed`,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      error: input.error,
    });
  }

  /**
   * Creates a workflow-waiting event (blocked/approval/input/evidence).
   */
  static workflowWaiting(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    reason: string;
  }): AgentEvent {
    return createWorkflowEvent({
      kind: "workflow_waiting",
      title: "Workflow waiting",
      description: input.reason,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      payload: { reason: input.reason },
    });
  }

  /**
   * Creates an approval-requested event.
   */
  static approvalRequested(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    requestedBy: string;
  }): AgentEvent {
    return createApprovalEvent({
      kind: "approval_requested",
      title: "Approval requested",
      description: `Human approval required for "${input.toolName}"`,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      payload: { toolName: input.toolName, requestedBy: input.requestedBy },
    });
  }

  /**
   * Creates an approval-granted event.
   */
  static approvalGranted(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    approvedBy: string;
  }): AgentEvent {
    return createApprovalEvent({
      kind: "approval_granted",
      title: "Approval granted",
      description: `Approved by ${input.approvedBy}`,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      payload: { approvedBy: input.approvedBy },
    });
  }

  /**
   * Creates an approval-rejected event.
   */
  static approvalRejected(input: {
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    rejectedBy: string;
    reason: string;
  }): AgentEvent {
    return createApprovalEvent({
      kind: "approval_rejected",
      title: "Approval rejected",
      description: input.reason,
      actor: input.actor,
      scope: input.scope,
      traceId: input.traceId,
      workspaceId: input.workspaceId,
      payload: { rejectedBy: input.rejectedBy, reason: input.reason },
    });
  }
}
