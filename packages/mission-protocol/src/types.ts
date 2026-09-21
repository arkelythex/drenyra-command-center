/**
 * Compatibility surface for the canonical drenyra-ai shared data structures:
 * snapshots, proposals, evidence, gates, and exceptions consumed by all
 * surfaces (API, web, CLI, MCP, mobile).
 */
export type {
	/** A fiscal exception raised against a mission (code, severity, resolution status). */
	AccountingException,
	/** Evidence item used in `computeEvidenceHash`. */
	EvidenceItem,
	/** Harness-level execution error (code, message, status, timeout flag). */
	HarnessError,
	/** A blocker occurring during mission execution, with severity and resolution timestamp. */
	MissionBlocker,
	/** A proposal awaiting approval, bound to its evidence hash and risk level. */
	MissionProposal,
	/** Record of a rejected proposal: reason, rejector, and rejected version. */
	MissionRejection,
	/** Full point-in-time state of a mission: status, steps, blockers, proposal, receipt. */
	MissionSnapshot,
	/** A single step within a mission's execution plan. */
	MissionStep,
	/** Result of evaluating a named readiness gate. */
	ReadinessGateResult,
} from "drenyra-ai/missions";
/** Receipt kind metadata — never enters the canonical content hash. */
export { ReceiptType } from "drenyra-ai/missions";
