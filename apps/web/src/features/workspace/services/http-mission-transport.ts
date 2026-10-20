import type { MissionSnapshot } from "@drenyra/mission-domain";
import { missionFetch } from "./mission-client";

/** The mission always belongs to the session's company; the API derives it. */
export interface CreateMissionInput {
	fiscalPeriod: string;
	intent:
		| "monthly-close"
		| "reconciliation"
		| "invoice-review"
		| "compliance-check";
	input: { instruction: string };
	idempotencyKey?: string;
}

export interface DecisionInput {
	proposalId: string;
	proposalVersion: number;
	expectedMissionVersion: number;
}

const BASE = "/api/v1/missions";

const post = <T>(path: string, body: unknown) =>
	missionFetch<T>(path, { method: "POST", body: JSON.stringify(body) });

export function createMission(command: CreateMissionInput) {
	return post<MissionSnapshot>(BASE, command);
}

export function executeMission(
	missionId: string,
	command: { expectedMissionVersion: number },
) {
	return post<MissionSnapshot>(`${BASE}/${missionId}/execute`, command);
}

export function getMission(missionId: string) {
	return missionFetch<MissionSnapshot>(`${BASE}/${missionId}`);
}

export function approveMission(
	missionId: string,
	command: DecisionInput & { evidenceHash: string },
) {
	return post<MissionSnapshot>(`${BASE}/${missionId}/approve`, command);
}

export function rejectMission(
	missionId: string,
	command: DecisionInput & { reason: string },
) {
	return post<MissionSnapshot>(`${BASE}/${missionId}/reject`, command);
}

export function reconcileMission(
	missionId: string,
	command: {
		resolution: "RUNNING" | "FAILED" | "COMPLETED";
		reason: string;
		expectedMissionVersion: number;
	},
) {
	return post<MissionSnapshot>(`${BASE}/${missionId}/reconcile`, command);
}
