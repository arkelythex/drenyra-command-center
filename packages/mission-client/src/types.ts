/**
 * @drenyra/mission-client transport types.
 *
 * Protocol types are imported from @drenyra/mission-protocol.
 * Consumers MUST import protocol types directly from @drenyra/mission-protocol,
 * NOT through this package.
 */

import type {
	MissionSnapshot,
	ReadinessGateResult,
	AccountingException,
	ApprovalResult,
	ReceiptVerification,
	MissionSummary,
	MissionFilter,
	CreateMissionCommand as CreateMissionInput,
	ExecuteMissionCommand as ExecuteCommand,
	ApproveMissionCommand as ApprovalInput,
	RejectMissionCommand as RejectInput,
	ReconcileMissionCommand as ReconcileInput,
} from "@drenyra/mission-protocol";

export type {
	MissionSnapshot,
	ReadinessGateResult,
	AccountingException,
	ApprovalResult,
	ReceiptVerification,
	MissionSummary,
	MissionFilter,
	CreateMissionInput,
	ExecuteCommand,
	ApprovalInput,
	RejectInput,
	ReconcileInput,
};

/**
 * MissionClient interface — canonical transport abstraction.
 * Implemented by HttpMissionClient and mock transports.
 */
export interface MissionClient {
	create(input: CreateMissionInput): Promise<MissionSnapshot>;
	get(id: string): Promise<MissionSnapshot>;
	list(filter?: MissionFilter): Promise<MissionSummary[]>;
	execute(id: string, command: ExecuteCommand): AsyncGenerator<MissionSnapshot>;
	approve(id: string, approval: ApprovalInput): Promise<ApprovalResult>;
	reject(id: string, input: RejectInput): Promise<void>;
	reconcile(id: string, input: ReconcileInput): Promise<MissionSnapshot>;
	getGates(id: string): Promise<ReadinessGateResult[]>;
	getExceptions(id: string): Promise<AccountingException[]>;
	verifyReceipt(missionId: string): Promise<ReceiptVerification>;
}
