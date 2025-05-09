/**
 * Inbox Repository Types (W2-05C).
 *
 * Minimal repository port for the inbox pattern, defined locally
 * to avoid a hard runtime dependency on the persistence package.
 */

// ─── Transaction client ──────────────────────────────────────────────────────

export type TxClient = unknown;

// ─── Input types ─────────────────────────────────────────────────────────────

export interface AcquireInput {
	consumerName: string;
	producer: string;
	messageId: string;
	messageType: string;
	payloadHash: string;
	organizationId?: string | undefined;
	companyId?: string | undefined;
	processingExpiresAt?: Date | undefined;
}

export interface MarkCompletedInput {
	inboxId: string;
	processingToken: string;
	resultMetadata?: unknown;
}

export interface MarkFailedInput {
	inboxId: string;
	processingToken: string;
	failureCode: string;
	failureClass: "RETRYABLE" | "TERMINAL";
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

// ─── Repository interface ────────────────────────────────────────────────────

export interface InboxRepository {
	acquire(
		tx: TxClient,
		input: AcquireInput,
		processingTimeoutMs: number,
	): Promise<InboxAcquisition>;

	markCompleted(tx: TxClient, input: MarkCompletedInput): Promise<void>;

	markFailed(tx: TxClient, input: MarkFailedInput): Promise<void>;
}
