/**
 * @drenyra/mission-domain — mission-contracts ADAPTER SHIM.
 *
 * The canonical mission types live in `drenyra-ai` (released
 * v0.0.1-prealpha.1). This file re-exports the shared protocol types from the
 * single authority. The legacy divergent command types (RunIntentCommand,
 * ApproveCommand, RejectCommand, ReconcileCommand) had no external consumers
 * (apps/web define their own) and are retired.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version/sequence numbers are JSON integers,
 * never floats.
 */

export type {
	EvidenceItem,
	HarnessError,
	MissionBlocker,
	MissionIntent,
	MissionProposal,
	MissionRejection,
	MissionSnapshot,
	MissionStep,
} from "drenyra-ai/missions";
