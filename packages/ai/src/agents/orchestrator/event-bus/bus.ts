import { randomUUID } from 'crypto';
import type {
  AgentEvent,
  AgentEventType,
  AgentEventHandler,
  EventSubscription,
  IEventBus,
} from './types';
import { loggers } from '../../../logger';

export class EventBus implements IEventBus {
  private subscriptions: Map<AgentEventType, Map<string, AgentEventHandler>>;
  private eventHistory: AgentEvent[];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    this.subscriptions = new Map();
    this.eventHistory = [];
  }

  emit<T extends AgentEvent>(event: T): void {
    const eventType = event.type;

    this.addToHistory(event);

    loggers.ai.info('Event emitted', { eventType, processId: event.processId });

    const subscribers = this.subscriptions.get(eventType);

    if (!subscribers || subscribers.size === 0) {
      loggers.ai.warn('No subscribers for event', { eventType });
      return;
    }

    for (const [subscriptionId, handler] of subscribers.entries()) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch((error) => {
            loggers.ai.error('Error in async handler', {
              subscriptionId,
              eventType,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      } catch (error) {
        loggers.ai.error('Error in handler', {
          subscriptionId,
          eventType,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  on<T extends AgentEvent>(
    eventType: AgentEventType,
    handler: AgentEventHandler<T>
  ): EventSubscription {
    const subscriptionId = randomUUID();

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Map());
    }

    const subscribers = this.subscriptions.get(eventType)!;
    subscribers.set(subscriptionId, handler as AgentEventHandler);

    loggers.ai.info('Subscribed to event', { eventType, subscriptionId });

    return {
      id: subscriptionId,
      eventType,
      handler: handler as AgentEventHandler,
    };
  }

  off(subscriptionId: string): void {
    let found = false;

    for (const [eventType, subscribers] of this.subscriptions.entries()) {
      if (subscribers.has(subscriptionId)) {
        subscribers.delete(subscriptionId);
        found = true;
        loggers.ai.info('Unsubscribed from event', { subscriptionId, eventType });

        if (subscribers.size === 0) {
          this.subscriptions.delete(eventType);
        }
        break;
      }
    }

    if (!found) {
      loggers.ai.warn('Subscription not found', { subscriptionId });
    }
  }

  once<T extends AgentEvent>(eventType: AgentEventType, handler: AgentEventHandler<T>): void {
    const wrappedHandler: AgentEventHandler<T> = (event: T) => {
      handler(event);
      this.off(subscription.id);
    };

    const subscription = this.on(eventType, wrappedHandler);
  }

  async waitFor<T extends AgentEvent>(
    eventType: AgentEventType,
    timeout: number = 30000,
    filter?: (event: T) => boolean
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(subscription.id);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subscription = this.on<T>(eventType, (event: T) => {
        if (filter && !filter(event)) {
          return;
        }

        clearTimeout(timeoutId);
        this.off(subscription.id);
        resolve(event);
      });
    });
  }

  getHistory(eventType?: AgentEventType, processId?: string): AgentEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    if (processId) {
      history = history.filter((e) => e.processId === processId);
    }

    return history;
  }

  clearHistory(): void {
    this.eventHistory = [];
    loggers.ai.info('Event history cleared');
  }

  getSubscriptions(): Map<AgentEventType, number> {
    const stats = new Map<AgentEventType, number>();

    for (const [eventType, subscribers] of this.subscriptions.entries()) {
      stats.set(eventType, subscribers.size);
    }

    return stats;
  }

  getStats(): {
    totalSubscriptions: number;
    eventTypes: number;
    historySize: number;
  } {
    let totalSubscriptions = 0;
    for (const subscribers of this.subscriptions.values()) {
      totalSubscriptions += subscribers.size;
    }

    return {
      totalSubscriptions,
      eventTypes: this.subscriptions.size,
      historySize: this.eventHistory.length,
    };
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
    loggers.ai.info('All subscriptions cleared');
  }

  private addToHistory(event: AgentEvent): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.shift();
    }
  }

  destroy(): void {
    this.clearSubscriptions();
    this.clearHistory();
    loggers.ai.info('EventBus destroyed');
  }
}

export const globalEventBus = new EventBus();
