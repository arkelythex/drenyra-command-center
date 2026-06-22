/**
 * Agent lifecycle state machine.
 *
 * Manages state transitions for agent instances through their lifecycle:
 * `idle` → `busy` → `completed` | `error`
 * Agents can also be `offline` and reset back to `idle` from any terminal state.
 *
 * @module @arkelythex/platform-core/kernel
 */

import type { AgentStatus } from "./types.js";

/**
 * Record of a single state transition.
 */
export interface LifecycleTransition {
  /** The previous status */
  from: AgentStatus;
  /** The next status */
  to: AgentStatus;
  /** ISO timestamp of when the transition occurred */
  timestamp: string;
}

/**
 * Options for constructing an AgentLifecycleManager.
 */
export interface LifecycleOptions {
  /** Called after each successful state transition */
  onTransition?: (transition: LifecycleTransition) => void;
  /** Called when an invalid transition is attempted */
  onError?: (message: string) => void;
}

/**
 * Map of valid transitions per source status.
 *
 * Each entry lists all allowed target statuses from that source.
 */
export const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle: ["busy", "offline"],
  busy: ["completed", "error", "idle"],
  completed: ["idle"],
  error: ["idle"],
  offline: ["idle"],
};

/**
 * Validates that a list of strings contains only valid AgentStatus values.
 */
function isValidStatus(value: string): value is AgentStatus {
  return ["idle", "busy", "error", "completed", "offline"].includes(value);
}

/**
 * Manages the lifecycle state machine for a single agent instance.
 *
 * @example
 * ```ts
 * const lifecycle = new AgentLifecycleManager("idle");
 * lifecycle.transitionTo("busy");
 * lifecycle.getStatus(); // "busy"
 * ```
 */
export class AgentLifecycleManager {
  private current: AgentStatus;
  private readonly options: LifecycleOptions;

  constructor(initialStatus: AgentStatus = "idle", options: LifecycleOptions = {}) {
    if (!isValidStatus(initialStatus)) {
      throw new Error(`Invalid initial status: ${initialStatus}`);
    }
    this.current = initialStatus;
    this.options = options;
  }

  /**
   * Return the current agent status.
   */
  getStatus(): AgentStatus {
    return this.current;
  }

  /**
   * Attempt a state transition.
   *
   * Throws `AgentError` if the transition is not allowed by `VALID_TRANSITIONS`.
   */
  transitionTo(target: AgentStatus): void {
    const allowed = VALID_TRANSITIONS[this.current];

    if (!allowed.includes(target)) {
      const message = `Invalid transition from ${this.current} to ${target}`;
      this.options.onError?.(message);
      throw new Error(message);
    }

    const from = this.current;
    this.current = target;
    this.options.onTransition?.({
      from,
      to: target,
      timestamp: new Date().toISOString(),
    });
  }
}
