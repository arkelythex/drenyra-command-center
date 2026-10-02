/**
 * @drenyra/mission-domain — mission-contracts ADAPTER SHIM.
 *
 * The canonical mission types live in `drenyra-ai` (released v0.5.0, contracts
 * frozen). This file re-exports the shared protocol types from the single
 * authority. The legacy command names (RunIntentCommand,
 * ApproveCommand, RejectCommand, ReconcileCommand) were retired: use
 * CreateMissionCommand, ApproveMissionCommand, RejectMissionCommand and
 * ReconcileMissionCommand.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version/sequence numbers are JSON integers,
 * never floats.
 */

export type {
	ApproveMissionCommand,
	CreateMissionCommand,
	EvidenceItem,
	ExecuteMissionCommand,
	HarnessError,
	MissionBlocker,
	MissionCommand,
	MissionIntent,
	MissionProposal,
	MissionRejection,
	MissionSnapshot,
	MissionStep,
	ReconcileMissionCommand,
	RejectMissionCommand,
} from "drenyra-ai/missions";
