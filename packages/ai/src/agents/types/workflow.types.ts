/**
 * Workflow Event Types
 * Event-driven architecture for agent orchestration
 */

import type {
	ArbitrationDecision,
	CDRResponse,
	Conflict,
	ExtractedData,
	ParsedData,
	ReaderInput,
	ValidationResult,
} from "./agent.types";

// ============================================================================
// Event Types
// ============================================================================

export type AgentEventType =
	| "INVOICE_RECEIVED"
	| "EXTRACTION_STARTED"
	| "EXTRACTION_COMPLETE"
	| "PARSING_STARTED"
	| "PARSING_COMPLETE"
	| "PARSING_SKIPPED"
	| "VALIDATION_STARTED"
	| "VALIDATION_COMPLETE"
	| "CONFLICT_DETECTED"
	| "ARBITRATION_STARTED"
	| "ARBITRATION_COMPLETED"
	| "XML_GENERATION_STARTED"
	| "XML_GENERATED"
	| "OSE_SUBMISSION_STARTED"
	| "OSE_SENT"
	| "OSE_FAILED"
	| "PROCESS_COMPLETED"
	| "PROCESS_FAILED"
	| "MANUAL_REVIEW_REQUIRED"
	| "PRUNE_REQUESTED"
	| "RECOVERY_STARTED"
	| "RECOVERY_COMPLETED"
	| "RECOVERY_FAILED"
	| "BATCH_STARTED"
	| "BATCH_PROGRESS"
	| "BATCH_ITEM_COMPLETED"
	| "BATCH_ITEM_FAILED"
	| "BATCH_COMPLETED"
	| "BATCH_FAILED";

// ============================================================================
// Batch Event Interfaces
// ============================================================================

export interface BatchStartedEvent extends BaseEvent {
	type: "BATCH_STARTED";
	batchId: string;
	total: number;
	companyId: string;
}

export interface BatchProgressEvent extends BaseEvent {
	type: "BATCH_PROGRESS";
	batchId: string;
	completed: number;
	failed: number;
	total: number;
}

export interface BatchItemCompletedEvent extends BaseEvent {
	type: "BATCH_ITEM_COMPLETED";
	batchId: string;
	runId: string;
	itemIndex: number;
}

export interface BatchItemFailedEvent extends BaseEvent {
	type: "BATCH_ITEM_FAILED";
	batchId: string;
	runId: string;
	itemIndex: number;
	error: string;
}

export interface BatchCompletedEvent extends BaseEvent {
	type: "BATCH_COMPLETED";
	batchId: string;
	completed: number;
	failed: number;
	total: number;
}

export interface BatchFailedEvent extends BaseEvent {
	type: "BATCH_FAILED";
	batchId: string;
	completed: number;
	failed: number;
	total: number;
	error: string;
}

// ============================================================================
// Agent Event Union
// ============================================================================

export type AgentEvent =
	| InvoiceReceivedEvent
	| ExtractionStartedEvent
	| ExtractionCompleteEvent
	| ParsingStartedEvent
	| ParsingCompleteEvent
	| ParsingSkippedEvent
	| ValidationStartedEvent
	| ValidationCompleteEvent
	| ConflictDetectedEvent
	| ArbitrationStartedEvent
	| ArbitrationCompletedEvent
	| XMLGenerationStartedEvent
	| XMLGeneratedEvent
	| OSESubmissionStartedEvent
	| OSESentEvent
	| OSEFailedEvent
	| ProcessCompletedEvent
	| ProcessFailedEvent
	| ManualReviewRequiredEvent
	| PruneRequestedEvent
	| RecoveryStartedEvent
	| RecoveryCompletedEvent
	| RecoveryFailedEvent
	| BatchStartedEvent
	| BatchProgressEvent
	| BatchItemCompletedEvent
	| BatchItemFailedEvent
	| BatchCompletedEvent
	| BatchFailedEvent;

// ============================================================================
// Event Interfaces
// ============================================================================

export interface BaseEvent {
	type: AgentEventType;
	timestamp: Date;
	processId: string;
}

export interface InvoiceReceivedEvent extends BaseEvent {
	type: "INVOICE_RECEIVED";
	payload: ReaderInput;
}

export interface ExtractionStartedEvent extends BaseEvent {
	type: "EXTRACTION_STARTED";
	agent: "reader";
}

export interface ExtractionCompleteEvent extends BaseEvent {
	type: "EXTRACTION_COMPLETE";
	agent: "reader";
	data: ExtractedData;
}

export interface ParsingStartedEvent extends BaseEvent {
	type: "PARSING_STARTED";
	agent: "parser";
}

export interface ParsingCompleteEvent extends BaseEvent {
	type: "PARSING_COMPLETE";
	agent: "parser";
	data: ParsedData;
}

export interface ParsingSkippedEvent extends BaseEvent {
	type: "PARSING_SKIPPED";
	agent: "parser";
	reason: string;
}

export interface ValidationStartedEvent extends BaseEvent {
	type: "VALIDATION_STARTED";
	agent: "validator";
}

export interface ValidationCompleteEvent extends BaseEvent {
	type: "VALIDATION_COMPLETE";
	agent: "validator";
	data: ValidationResult;
}

export interface ConflictDetectedEvent extends BaseEvent {
	type: "CONFLICT_DETECTED";
	conflicts: Conflict[];
	requiresArbitration?: boolean;
}

export interface ArbitrationStartedEvent extends BaseEvent {
	type: "ARBITRATION_STARTED";
	agent: "arbitrator";
	conflicts: Conflict[];
}

export interface ArbitrationCompletedEvent extends BaseEvent {
	type: "ARBITRATION_COMPLETED";
	agent: "arbitrator";
	decision: ArbitrationDecision;
}

export interface XMLGenerationStartedEvent extends BaseEvent {
	type: "XML_GENERATION_STARTED";
}

export interface XMLGeneratedEvent extends BaseEvent {
	type: "XML_GENERATED";
	xml: string;
	signedXml?: string;
}

export interface OSESubmissionStartedEvent extends BaseEvent {
	type: "OSE_SUBMISSION_STARTED";
	oseProvider: string;
}

export interface OSESentEvent extends BaseEvent {
	type: "OSE_SENT";
	cdr: CDRResponse;
}

export interface OSEFailedEvent extends BaseEvent {
	type: "OSE_FAILED";
	error: string;
	retryCount: number;
}

export interface ProcessCompletedEvent extends BaseEvent {
	type: "PROCESS_COMPLETED";
	invoiceNumber?: string;
	totalTime?: number;
	duration?: number;
	metrics?: unknown;
}

export interface ProcessFailedEvent extends BaseEvent {
	type: "PROCESS_FAILED";
	error: string | Error;
	stage?: string;
}

export interface ManualReviewRequiredEvent extends BaseEvent {
	type: "MANUAL_REVIEW_REQUIRED";
	reason: string;
	conflicts: Conflict[];
}

// Emitted when the context monitor detects that a run has crossed the
// configured usage threshold and pruning should be considered.
export interface PruneRequestedEvent extends BaseEvent {
	type: "PRUNE_REQUESTED";
	usage: {
		totalTokens: number;
		contextWindow: number;
		usagePercent: number;
	};
	threshold: number;
}

// ============================================================================
// Recovery Events
// ============================================================================

/** Emitted when a recovery attempt starts for a failed run. */
export interface RecoveryStartedEvent extends BaseEvent {
	type: "RECOVERY_STARTED";
	workflowState: string;
}

/** Emitted when a recovery attempt completes successfully. */
export interface RecoveryCompletedEvent extends BaseEvent {
	type: "RECOVERY_COMPLETED";
	workflowState: string;
	duration: number;
}

/** Emitted when a recovery attempt fails. */
export interface RecoveryFailedEvent extends BaseEvent {
	type: "RECOVERY_FAILED";
	error: string;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type AgentEventHandler<T extends AgentEvent = AgentEvent> = (
	event: T,
) => void | Promise<void>;

export interface EventSubscription {
	id: string;
	eventType: AgentEventType;
	handler: AgentEventHandler;
}

export interface EventBus {
	emit<T extends AgentEvent>(event: T): void;
	on<T extends AgentEvent>(
		eventType: AgentEventType,
		handler: AgentEventHandler<T>,
	): EventSubscription;
	off(subscriptionId: string): void;
	once<T extends AgentEvent>(
		eventType: AgentEventType,
		handler: AgentEventHandler<T>,
	): void;
}

// ============================================================================
// Workflow State Machine
// ============================================================================

export type WorkflowState =
	| "IDLE"
	| "EXTRACTING"
	| "PARSING"
	| "VALIDATING"
	| "ARBITRATING"
	| "GENERATING_XML"
	| "SUBMITTING_OSE"
	| "COMPLETED"
	| "FAILED"
	| "MANUAL_REVIEW";

export interface WorkflowContext {
	processId: string;
	state: WorkflowState;
	input: ReaderInput;
	extractedData?: ExtractedData;
	parsedData?: ParsedData;
	validationResult?: ValidationResult;
	conflicts?: Conflict[];
	arbitrationDecision?: ArbitrationDecision;
	xmlContent?: string;
	cdrResponse?: CDRResponse;
	error?: string | Error;
	startTime: Date;
	endTime?: Date;
}

export type WorkflowTransition = {
	from: WorkflowState;
	to: WorkflowState;
	event: AgentEventType;
};

// ============================================================================
// Metrics & Monitoring
// ============================================================================

export interface AgentMetrics {
	agentId: string;
	role: string;
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	averageLatency: number;
	totalTokensUsed: number;
	totalCost: number;
	cacheHitRate: number;
}

export interface WorkflowMetrics {
	totalProcessed: number;
	successRate: number;
	averageProcessingTime: number;
	arbitrationRate: number;
	manualReviewRate: number;
	oseSuccessRate: number;
	costPerInvoice: number;
}
