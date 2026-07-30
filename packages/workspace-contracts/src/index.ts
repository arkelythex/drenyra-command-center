// ─── Barrel Exports — workspace-contracts ────────────────────────────────────

export {
	CreateWorkspaceCommandSchema,
	AddCompanyCommandSchema,
	ChangeObjectiveCommandSchema,
	CreateViewCommandSchema,
	MoveViewCommandSchema,
	AttachToExecutionCommandSchema,
	DetachFromExecutionCommandSchema,
	ResumeWorkspaceCommandSchema,
	ApplyLayoutCommandSchema,
	WorkspaceCommandSchema,
	CommandEnvelopeSchema,
} from "./workspace-commands";

export type {
	CreateWorkspaceCommand,
	AddCompanyCommand,
	ChangeObjectiveCommand,
	CreateViewCommand,
	MoveViewCommand,
	AttachToExecutionCommand,
	DetachFromExecutionCommand,
	ResumeWorkspaceCommand,
	ApplyLayoutCommand,
	WorkspaceCommand,
	CommandEnvelope,
} from "./workspace-commands";

export {
	CURRENT_CONTRACTS_VERSION,
	MIN_SUPPORTED_CONTRACTS_VERSION,
} from "./version";
