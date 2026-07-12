/**
 * Shared mission types for Drenyra mission workspace.
 *
 * A mission is an accounting workflow with transparent progress,
 * evidence, confidence, approval, and blocked states.
 */

/** Mission lifecycle states */
export const MISSION_STATUS = {
	QUEUED: "queued",
	ANALYZING: "analyzing",
	REQUIRES_REVIEW: "requires_review",
	READY_TO_APPROVE: "ready_to_approve",
	APPROVED: "approved",
	EXPORTED_OR_SENT: "exported_or_sent",
	OBSERVED: "observed",
	ARCHIVED_WITH_EVIDENCE: "archived_with_evidence",
} as const;

export type MissionStatus =
	(typeof MISSION_STATUS)[keyof typeof MISSION_STATUS];

/** Timeline event for agentic workflows */
export interface MissionTimelineEvent {
	id: string;
	timestamp: string;
	actor: "agent" | "system" | "accountant" | "sunat";
	action: string;
	description: string;
	status: "success" | "warning" | "error" | "info" | "blocked";
	scope?: string;
	evidenceId?: string;
}

/** A blocker that prevents mission progress */
export interface MissionBlocker {
	id: string;
	reason: string;
	severity: "low" | "medium" | "high" | "critical";
	resolved: boolean;
	resolvedAt?: string;
	resolvedBy?: string;
}

/** Risk assessment for a mission */
export interface MissionRisk {
	level: "low" | "medium" | "high" | "critical";
	description: string;
	source: string;
}

/** Accounting mission workspace */
export interface Mission<TData = unknown> {
	id: string;
	title: string;
	type: string;
	status: MissionStatus;
	progress: number; // 0-100
	company: string;
	ruc: string;
	period: string;
	risk: MissionRisk;
	timeline: MissionTimelineEvent[];
	blockers: MissionBlocker[];
	data: TData;
}
