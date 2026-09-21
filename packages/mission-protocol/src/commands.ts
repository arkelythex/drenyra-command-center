/**
 * Compatibility surface for the canonical drenyra-ai mission command types.
 * Transport-agnostic: every command defines the complete input contract for
 * a mission operation, used by both HTTP and non-HTTP clients.
 */
export type {
	/** Result of an approval action. */
	ApprovalResult,
	/** Approve a mission proposal with evidence binding. */
	ApproveMissionCommand,
	/** Create a new mission. */
	CreateMissionCommand,
	/** Execute (start or resume) a mission with optimistic concurrency control. */
	ExecuteMissionCommand,
	/** Aggregate discriminated-union type for all mission commands. */
	MissionCommand,
	/** Filter for listing missions. */
	MissionFilter,
	/** The type of accounting work the mission performs. */
	MissionIntent,
	/** List/summary view of a mission. */
	MissionSummary,
	/** Result of a receipt verification. */
	ReceiptVerification,
	/** Reconcile a mission from UNKNOWN to a known state. */
	ReconcileMissionCommand,
	/** Reject a mission proposal with a required reason. */
	RejectMissionCommand,
} from "drenyra-ai/missions";
