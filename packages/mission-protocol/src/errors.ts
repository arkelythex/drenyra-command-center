/**
 * Compatibility surface for the canonical drenyra-ai mission error taxonomy.
 * Families: AUTH, TENANT, VALIDATION, CONCURRENCY, IDEMPOTENCY, MISSION_STATE,
 * EVIDENCE, APPROVAL, EXTERNAL_SYSTEM — each code maps to a default HTTP status.
 */
export {
	/** Type guard: narrows any error to `MissionError`. */
	isMissionError,
	/** Typed mission error with a machine-readable `code`, `family`, and `isRetryable`. */
	MissionError,
	/** Canonical error codes organized by family. */
	MissionErrorCode,
} from "drenyra-ai/missions";
