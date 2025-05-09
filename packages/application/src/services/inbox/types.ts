/**
 * Inbox Consumer types (W2-05C).
 *
 * Transport-agnostic types for the transactional consumption wrapper.
 * The broker integration (NATS, BullMQ, webhooks) uses these to
 * decide ACK/NACK/dead-letter behavior.
 */

// ─── Input ───────────────────────────────────────────────────────────────────

export interface ConsumeInput {
	consumerName: string;
	producer: string;
	messageId: string;
	messageType: string;
	payload: unknown;
	payloadVersion: number;
	organizationId?: string;
	companyId?: string;
}

// ─── InboxAcquisition — closed result type ───────────────────────────────────

export type InboxAcquisition =
	| {
			kind: "ACQUIRED";
			inboxId: string;
			processingToken: string;
			attemptCount: number;
	  }
	| {
			kind: "ALREADY_COMPLETED";
			resultMetadata: unknown;
	  }
	| {
			kind: "CURRENTLY_PROCESSING";
			retryAfter?: Date;
	  }
	| {
			kind: "TERMINAL_FAILURE";
			failureCode: string;
	  }
	| {
			kind: "PAYLOAD_CONFLICT";
			expectedHash: string;
	  };

// ─── Broker action decision ──────────────────────────────────────────────────

export type BrokerAction =
	| { action: "ack" }
	| { action: "retry"; delayMs?: number }
	| { action: "dead-letter"; reason: string };

// ─── Errors ──────────────────────────────────────────────────────────────────

export class InboxPayloadConflictError extends Error {
	constructor(
		public readonly consumerName: string,
		public readonly messageId: string,
	) {
		super(
			`Message ${messageId} for consumer ${consumerName} was already processed with a different payload`,
		);
		this.name = "InboxPayloadConflictError";
	}
}

export class InboxCurrentlyProcessingError extends Error {
	constructor(
		public readonly consumerName: string,
		public readonly messageId: string,
	) {
		super(
			`Message ${messageId} is currently being processed by consumer ${consumerName}`,
		);
		this.name = "InboxCurrentlyProcessingError";
	}
}
