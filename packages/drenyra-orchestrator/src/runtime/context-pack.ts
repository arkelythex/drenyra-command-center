/**
 * SDD-009B — Context Pack and Handoff types.
 */

import type { AgentRole } from "./budget";

// ============================================================================
// Evidence Block
// ============================================================================

export interface EvidenceBlock {
	source: string; // "test:unit" | "lint:eslint" | "tool:exec"
	status: "passed" | "failed" | "warning" | "info";
	summary: string;
	detail: string | null;
	timestamp: string;
}

// ============================================================================
// Context Pack Manifest — SDD-009B §2.3
// ============================================================================

export interface ContextPackManifest {
	role: AgentRole;
	phaseId: string;
	sessionAffinityId: string;

	stablePrefix: {
		systemPrompt: string;
		skillRegistryPaths: string[];
		normativeContracts: string[];
	};

	dynamicContent: {
		taskInstruction: string;
		affectedPaths: string[];
		recentEvidence: EvidenceBlock[];
	};

	totalEstimatedTokens: number;
	withinBudget: boolean;
}

// ============================================================================
// Handoff Envelope — SDD-009B §2.4
// ============================================================================

export interface PhaseResult {
	status: "completed" | "failed" | "escalated" | "blocked";
	artifacts: string[];
	skillResolution:
		| "paths-injected"
		| "fallback-registry"
		| "fallback-path"
		| "none";
	nextRecommended: string;
	risks: string[];
}

export interface CompactionCheckpoint {
	lastCompactionAt: string | null;
	decisionsPersisted: boolean;
	skillRegistryReloaded: boolean;
}

export interface HandoffEnvelope {
	phaseId: string;
	fromRole: AgentRole;
	toRole: AgentRole;
	contextPack: ContextPackManifest;
	phaseResult: PhaseResult;
	compactionCheckpoint: CompactionCheckpoint;
	checksum: string;
	timestamp: string;
}
