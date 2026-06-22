/**
 * Domain-agnostic in-process event bus for agent communication.
 *
 * Provides publish/subscribe semantics with typed event names.
 * No fiscal-specific event types — all events are generic key-value pairs.
 *
 * @module @arkelythex/platform-core/kernel
 */

/**
 * A generic event envelope delivered to subscribers.
 */
export interface EventEnvelope {
  /** The event type discriminator (e.g. "task.completed") */
  type: string;
  /** The event payload */
  payload: unknown;
  /** ISO timestamp of when the event was emitted */
  timestamp: string;
}

/**
 * Event handler function type.
 */
export type EventHandler = (event: EventEnvelope) => void;

/**
 * In-process event bus for inter-agent communication.
 *
 * @example
 * ```ts
 * const bus = new EventBus();
 * bus.on("task.completed", (event) => console.log(event));
 * bus.emit("task.completed", { taskId: "123" });
 * ```
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private onceHandlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to events of a specific type.
   *
   * Use `"*"` to subscribe to all events.
   */
  on(type: string, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * Subscribe to the next event of a specific type, then auto-remove.
   */
  once(type: string, handler: EventHandler): void {
    if (!this.onceHandlers.has(type)) {
      this.onceHandlers.set(type, new Set());
    }
    this.onceHandlers.get(type)!.add(handler);
  }

  /**
   * Unsubscribe a handler from a specific event type.
   */
  off(type: string, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
    this.onceHandlers.get(type)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers of the given type and wildcard subscribers.
   */
  emit(type: string, payload: unknown): void {
    const envelope: EventEnvelope = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Dispatch to type-specific handlers
    this.dispatch(type, envelope);

    // Dispatch to wildcard subscribers
    this.dispatch("*", envelope);

    // Clean up once handlers for this type
    this.onceHandlers.delete(type);
  }

  /**
   * Remove all handlers for a specific event type.
   */
  removeAllListeners(type: string): void {
    this.handlers.delete(type);
    this.onceHandlers.delete(type);
  }

  /**
   * Internal dispatch to a handler set, catching errors.
   */
  private dispatch(type: string, envelope: EventEnvelope): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(envelope);
        } catch {
          // Swallow handler errors — one bad handler must not break others
        }
      }
    }

    const onceHandlers = this.onceHandlers.get(type);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          handler(envelope);
        } catch {
          // Swallow handler errors
        }
      }
    }
  }
}
