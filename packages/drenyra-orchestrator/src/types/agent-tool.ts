// ─── AgentTool Types ───────────────────────────────────────────────
// Snapshot from @drenyra/agent-swarm/src/erp/types/agent-tool.ts

import type { z } from 'zod';
import type { ApprovalLevel } from './approval-gate';
import type { AgentContext } from './agent-context';

export interface AgentTool<TInput = unknown, TOutput = unknown> {
	name: string;
	description: string;
	inputSchema: z.ZodSchema<TInput>;
	outputSchema: z.ZodSchema<TOutput>;
	approvalLevel: ApprovalLevel;
	execute: (input: TInput, context: AgentContext) => Promise<TOutput>;
	needsApproval?: (input: TInput, context: AgentContext) => boolean;
}

export type ActionResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string; code?: string; details?: unknown };

export interface AgentToolExecution {
	toolName: string;
	input: unknown;
	output: ActionResult<unknown>;
	approvalLevel: ApprovalLevel;
	durationMs: number;
	context: AgentContext;
}
