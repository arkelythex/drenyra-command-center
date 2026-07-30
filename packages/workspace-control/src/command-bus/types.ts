import type {
	CommandEnvelope,
	WorkspaceCommand,
} from "@drenyra/workspace-contracts";

// ─── Middleware function type ───────────────────────────────────────────────

export type CommandMiddleware = (
	envelope: CommandEnvelope,
	next: (envelope: CommandEnvelope) => CommandResult,
) => CommandResult;

// ─── Command handler type ──────────────────────────────────────────────────

export type CommandHandler = (
	command: WorkspaceCommand,
	envelope: CommandEnvelope,
) => CommandResult;

// ─── Middleware context ────────────────────────────────────────────────────

export interface MiddlewareContext {
	validatedCommand?: WorkspaceCommand;
	userId?: string;
	clientId?: string;
	authority?: string;
	skipFeosGate?: boolean;
}

// ─── Command result ────────────────────────────────────────────────────────

export type CommandResult =
	| {
			readonly ok: true;
			readonly data: unknown;
			readonly correlationId?: string;
	  }
	| {
			readonly ok: false;
			readonly error: string;
			readonly code: string;
			readonly correlationId?: string;
	  };
