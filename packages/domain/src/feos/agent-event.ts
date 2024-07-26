/**
 * FEOS-007 — Agent Event Projection
 *
 * Canonical agent event types for proyección onto workspace state.
 * Maps Pi agent events → Drenyra workspace events → UI updates.
 *
 * Pi events: tool_started, tool_progress, tool_completed, error
 * → Drenyra Agent Event → Workflow Event → Workspace Projection → UI update
 *
 * @module @drenyra/domain/feos/agent-event
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";

// ============================================================================
// Event Severity
// ============================================================================

export const EVENT_SEVERITY = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export type EventSeverity = (typeof EVENT_SEVERITY)[keyof typeof EVENT_SEVERITY];

// ============================================================================
// Agent Event Types
// ============================================================================

/** High-level classification of an agent event. */
export type AgentEventKind =
  | "tool_started"
  | "tool_progress"
  | "tool_completed"
  | "tool_error"
  | "agent_thinking"
  | "agent_message"
  | "workflow_transition"
  | "workflow_waiting"
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected"
  | "evidence_generated"
  | "error"
  | "system"
  ;

// ============================================================================
// Agent Event
// ============================================================================

export interface AgentEvent {
  /** Unique event ID. */
  id: string;
  /** Event kind — determines how the event is projected. */
  kind: AgentEventKind;
  /** Severity level. */
  severity: EventSeverity;
  /** Human-readable title. */
  title: string;
  /** Detailed description. */
  description: string;
  /** Agent or system that produced the event. */
  actor: Actor;
  /** Fiscal scope at the time of the event. */
  scope: FiscalScope;
  /** When the event occurred. */
  timestamp: Timestamp;
  /** Trace ID for correlation across events. */
  traceId: string;
  /** Workspace ID this event belongs to, if any. */
  workspaceId?: string;
  /** Tool name if this is a tool-related event. */
  toolName?: string;
  /** Tool risk level if applicable. */
  toolRiskLevel?: ToolRiskLevel;
  /** Progress information (for tool_progress). */
  progress?: EventProgress;
  /** Structured payload with event-specific data. */
  payload?: Record<string, unknown>;
  /** Related event IDs (causality chain). */
  relatedEventIds?: string[];
  /** Tags for filtering. */
  tags?: string[];
}

export interface EventProgress {
  current: number;
  total: number;
  label: string; // e.g. "12,480 / 18,420 records compared"
}

// ============================================================================
// Workflow State — derived from events
// ============================================================================

/**
 * Derived workflow state — computed from a sequence of agent events.
 */
export interface WorkflowState {
  workspaceId: string;
  status: "running" | "waiting" | "completed" | "failed" | "unknown";
  currentTool?: string;
  progress?: EventProgress;
  lastEvent: AgentEvent;
  events: AgentEvent[];
  warnings: number;
  errors: number;
  startedAt: Timestamp;
  lastUpdated: Timestamp;
}

// ============================================================================
// Event Store (projection target)
// ============================================================================

export interface AgentEventStore {
  /** Append an event to the store. */
  append(event: AgentEvent): Promise<void>;
  /** Get events for a workspace, ordered by timestamp asc. */
  getWorkspaceEvents(workspaceId: string, limit?: number): Promise<AgentEvent[]>;
  /** Get events for a trace. */
  getTraceEvents(traceId: string): Promise<AgentEvent[]>;
  /** Get the latest event for a workspace. */
  getLatestEvent(workspaceId: string): Promise<AgentEvent | null>;
  /** Get all events matching a filter. */
  query(filter: EventFilter): Promise<AgentEvent[]>;
}

export interface EventFilter {
  workspaceId?: string;
  traceId?: string;
  kind?: AgentEventKind;
  severity?: EventSeverity;
  since?: string; // ISO timestamp
  until?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Event Construction Helpers
// ============================================================================

/**
 * Create an AgentEvent for a tool lifecycle event.
 */
export function createToolEvent(input: {
  kind: "tool_started" | "tool_progress" | "tool_completed" | "tool_error";
  title: string;
  description: string;
  actor: Actor;
  scope: FiscalScope;
  traceId: string;
  workspaceId?: string;
  toolName: string;
  toolRiskLevel?: ToolRiskLevel;
  progress?: EventProgress;
  payload?: Record<string, unknown>;
  error?: string;
}): AgentEvent {
  const severity = input.kind === "tool_error" ? "error"
    : input.kind === "tool_completed" ? "info"
    : "debug";

  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    severity,
    title: input.title,
    description: input.error || input.description,
    actor: input.actor,
    scope: input.scope,
    timestamp: { iso: new Date().toISOString(), unix: Date.now() },
    traceId: input.traceId,
    workspaceId: input.workspaceId,
    toolName: input.toolName,
    toolRiskLevel: input.toolRiskLevel,
    progress: input.progress,
    payload: {
      ...input.payload,
      ...(input.error ? { error: input.error } : {}),
    },
  };
}

/**
 * Create an AgentEvent for a workflow transition.
 */
export function createWorkflowEvent(input: {
  kind: "workflow_transition" | "workflow_waiting";
  title: string;
  description: string;
  actor: Actor;
  scope: FiscalScope;
  traceId: string;
  workspaceId?: string;
  payload?: Record<string, unknown>;
}): AgentEvent {
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    severity: input.kind === "workflow_waiting" ? "warning" : "info",
    title: input.title,
    description: input.description,
    actor: input.actor,
    scope: input.scope,
    timestamp: { iso: new Date().toISOString(), unix: Date.now() },
    traceId: input.traceId,
    workspaceId: input.workspaceId,
    payload: input.payload,
  };
}

/**
 * Create an AgentEvent for an approval action.
 */
export function createApprovalEvent(input: {
  kind: "approval_requested" | "approval_granted" | "approval_rejected";
  title: string;
  description: string;
  actor: Actor;
  scope: FiscalScope;
  traceId: string;
  workspaceId?: string;
  payload?: Record<string, unknown>;
}): AgentEvent {
  const severityMap: Record<string, EventSeverity> = {
    approval_requested: "warning",
    approval_granted: "info",
    approval_rejected: "error",
  };

  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    severity: severityMap[input.kind] ?? "info",
    title: input.title,
    description: input.description,
    actor: input.actor,
    scope: input.scope,
    timestamp: { iso: new Date().toISOString(), unix: Date.now() },
    traceId: input.traceId,
    workspaceId: input.workspaceId,
    payload: input.payload,
  };
}

// ============================================================================
// Event Projection — compute workspace state from events
// ============================================================================

/**
 * Project a sequence of agent events into a workflow state summary.
 */
export function projectWorkflowState(events: AgentEvent[]): WorkflowState {
  if (events.length === 0) {
    throw new Error("Cannot project state from empty event list");
  }

  const sorted = [...events].sort((a, b) => a.timestamp.unix - b.timestamp.unix);
  const last = sorted[sorted.length - 1];
  const hasErrors = sorted.some((e) => e.severity === "error" || e.severity === "critical");
  const hasApprovalRequest = sorted.some((e) => e.kind === "approval_requested");

  // Determine status
  let status: WorkflowState["status"];
  if (last.kind === "tool_error" || last.severity === "critical") {
    status = "failed";
  } else if (hasApprovalRequest || last.kind === "workflow_waiting") {
    status = "waiting";
  } else if (last.kind === "tool_completed" && !hasApprovalRequest) {
    // Only "completed" if the last event is a completion with no pending approvals
    status = "completed";
  } else {
    status = "running";
  }

  // Get current tool
  const lastToolEvent = [...sorted].reverse().find(
    (e) => e.toolName && (e.kind === "tool_started" || e.kind === "tool_progress"),
  );

  return {
    workspaceId: last.workspaceId ?? "unknown",
    status,
    currentTool: lastToolEvent?.toolName,
    progress: last.progress,
    lastEvent: last,
    events: sorted,
    warnings: sorted.filter((e) => e.severity === "warning").length,
    errors: hasErrors ? sorted.filter((e) => e.severity === "error" || e.severity === "critical").length : 0,
    startedAt: sorted[0].timestamp,
    lastUpdated: last.timestamp,
  };
}
