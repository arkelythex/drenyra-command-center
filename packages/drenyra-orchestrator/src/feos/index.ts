/**
 * Drenyra Orchestrator — FEOS Integration
 *
 * Barrel exports for orchestrator-level FEOS modules.
 * These extend the domain-level FEOS types with runtime logic.
 *
 * @module @drenyra/orchestrator/feos
 */

// Tool Contract Router
export type {
  ApprovalRequest,
  ToolRouteAction,
  ToolRouteContext,
} from "./tool-contract-router";
export {
  requiresApproval,
  requiresRouting,
  routeToolCall,
} from "./tool-contract-router";

// Agent Event Bus
export { AgentEventBus, AgentEventFactory } from "./agent-event-bus";
export type { EventHandler, EventSubscription } from "./agent-event-bus";
