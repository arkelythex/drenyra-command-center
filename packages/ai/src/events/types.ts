/**
 * Agent Event Adapter — Types
 *
 * @module events
 */

import type { AgentEvent as CanonicalEvent } from "@arkelythex/shared";
import type { EventBus } from "../agents/types/workflow.types";

export interface EventAdapter {
	subscribe(eventBus: EventBus, onEvent: (event: CanonicalEvent) => void): void;

	unsubscribe(): void;
}
