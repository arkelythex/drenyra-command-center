/**
 * @drenyra/mission-domain — mission-contracts ADAPTER SHIM.
 *
 * The canonical mission types live in `drenyra-ai` (released v0.5.0, contracts
 * frozen). This file re-exports the shared protocol types from the single
 * authority. The legacy command names (RunIntentCommand, ApproveCommand,
 * RejectCommand, ReconcileCommand) are still used by apps/api missions and are
 * kept as deprecated aliases of the canonical commands; migrate callers to
 * CreateMissionCommand, ApproveMissionCommand, RejectMissionCommand and
 * ReconcileMissionCommand and then delete the aliases.
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

import type {
	ApproveMissionCommand,
	CreateMissionCommand,
	ReconcileMissionCommand,
	RejectMissionCommand,
} from "drenyra-ai/missions";

/** @deprecated Use {@link CreateMissionCommand}. */
export type RunIntentCommand = CreateMissionCommand;
/** @deprecated Use {@link ApproveMissionCommand}. */
export type ApproveCommand = ApproveMissionCommand;
/** @deprecated Use {@link RejectMissionCommand}. */
export type RejectCommand = RejectMissionCommand;
/** @deprecated Use {@link ReconcileMissionCommand}. */
export type ReconcileCommand = ReconcileMissionCommand;
