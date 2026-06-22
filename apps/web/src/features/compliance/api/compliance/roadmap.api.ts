/**
 * Roadmap MVP API methods
 *
 * @module compliance/roadmap
 */

import { getTenantContext } from "@/lib/api";
import {
	ApiError,
	extractOkData,
	extractOkDataOrPassthrough,
	unwrap,
} from "@/lib/api-helpers";
import type {
	RoadmapActionId,
	RoadmapDecisionType,
	RoadmapMvpActionRunResult,
	RoadmapMvpDecisionResult,
	RoadmapMvpSnapshot,
	RoadmapTimeline,
} from "../../components/shared/types";
import { getComplianceClient } from "../compliance-client";

const complianceClient = getComplianceClient();

export const roadmapApi = {
	/**
	 * GET /compliance/roadmap-mvp
	 * Returns the Phase 1 + Phase 2 snapshot for the current period.
	 */
	getRoadmapMvpSnapshot: async (
		companyId: string,
		year: number,
		month: number,
	): Promise<RoadmapMvpSnapshot> => {
		const body = await unwrap(
			complianceClient["roadmap-mvp"].get({
				query: { companyId, year, month },
			}),
		);
		return extractOkData(
			body,
			"No se pudo cargar el estado roadmap MVP",
		) as RoadmapMvpSnapshot;
	},

	/**
	 * POST /compliance/roadmap-mvp/actions/:actionId/run
	 * Executes a one-click copilot action.
	 */
	runRoadmapAction: async (
		actionId: RoadmapActionId,
		traceId: string,
		countryCode?: string,
	): Promise<RoadmapMvpActionRunResult> => {
		const { companyId } = getTenantContext();
		const now = new Date();
		const body = await unwrap(
			complianceClient["roadmap-mvp"].actions({ actionId }).run.post({
				companyId,
				year: now.getFullYear(),
				month: now.getMonth() + 1,
				traceId,
				countryCode,
			}),
		);
		return extractOkData(
			body,
			"No se pudo ejecutar la accion del copilot",
		) as RoadmapMvpActionRunResult;
	},

	/**
	 * POST /compliance/roadmap-mvp/decisions
	 * Registers a human HITL decision (approve / reject / escalate).
	 */
	decideRoadmapAction: async (
		actionId: RoadmapActionId,
		traceId: string,
		decision: RoadmapDecisionType,
		reason: string,
		decidedBy?: string,
	): Promise<RoadmapMvpDecisionResult> => {
		const { companyId } = getTenantContext();
		const now = new Date();
		const body = await unwrap(
			complianceClient["roadmap-mvp"].decisions.post({
				companyId,
				year: now.getFullYear(),
				month: now.getMonth() + 1,
				actionId,
				traceId,
				decision,
				reason,
				decidedBy,
			}),
		);
		return extractOkData(
			body,
			"No se pudo registrar la decision HITL",
		) as RoadmapMvpDecisionResult;
	},

	/**
	 * GET /compliance/roadmap-mvp/timeline/:actionId
	 * Returns the stitched recommendation → decision → effect timeline.
	 */
	getRoadmapTimeline: async (
		actionId: RoadmapActionId,
		traceId: string,
	): Promise<RoadmapTimeline | null> => {
		const { companyId } = getTenantContext();
		const now = new Date();
		try {
			const body = await unwrap(
				complianceClient["roadmap-mvp"].timeline({ actionId }).get({
					query: {
						companyId,
						year: now.getFullYear(),
						month: now.getMonth() + 1,
						traceId,
					},
				}),
			);
			if (
				body &&
				typeof body === "object" &&
				"success" in body &&
				(body as { success: boolean }).success === false
			) {
				return null;
			}
			return extractOkDataOrPassthrough(
				body,
				"No se pudo cargar el timeline de la accion",
			) as RoadmapTimeline;
		} catch (error: unknown) {
			/** Align with `handleRoadmapError` in roadmap-mvp — absent timeline is not a hard error. */
			if (error instanceof ApiError) {
				const c = error.code;
				if (
					c === "ROADMAP_ACTION_NOT_AVAILABLE" ||
					c === "ROADMAP_TRACE_MISMATCH" ||
					c === "ACCOUNTING_JOB_NOT_SUPPORTED"
				) {
					return null;
				}
			}
			throw error;
		}
	},
};
