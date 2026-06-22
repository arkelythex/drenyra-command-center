/**
 * Agent Types
 *
 * Core types for the Arkelythex agent system.
 */

export interface AgentConfig {
	name: string;
	modelId: string;
	instructions: string;
}

export interface AgentResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}
