import { Elysia } from "elysia";
import {
	companyScopeGuard,
	rejectForeignCompanyId,
} from "../../shared/plugins/company-scope-guard";
import { wireMonthlyCloseHandler } from "./intent-handlers/wire-monthly-close";
import { createMissionMemoryRecorder } from "./mission-memory.recorder";
import { type MissionFailure, MissionsController } from "./missions.controller";
import { MissionsService } from "./missions.service";
import {
	ApproveMissionSchema,
	CreateMissionSchema,
	ExecuteMissionSchema,
	MissionIdParams,
	ReconcileMissionSchema,
	RejectMissionSchema,
} from "./schema/mission.schema";
import { MissionEventStore } from "./sse/mission-event-store";

type MissionResult = { success: true } | MissionFailure;

/**
 * Answers a controller result: errors take their HTTP status (404, 409, 500…)
 * instead of a 200 with `success: false`, and keep the `{success,error}` body.
 */
function sendMissionResult<R extends MissionResult>(
	set: { status?: number | string },
	result: R,
	successStatus = 200,
) {
	if (result.success) {
		set.status = successStatus;
		return result;
	}
	const { status, ...body } = result as MissionFailure;
	set.status = status;
	return body;
}

export const createMissionsRoutes = (db: any) => {
	const service = new MissionsService(
		db,
		undefined,
		undefined,
		createMissionMemoryRecorder(),
	);
	const eventStore = new MissionEventStore(db);
	// Wire the REAL monthly-close pipeline into the intent registry. Fail
	// closed: stays dormant unless MONTHLY_CLOSE_PIPELINE_ENABLED=true.
	wireMonthlyCloseHandler(db, eventStore);
	const ctrl = new MissionsController(service, eventStore);

	return new Elysia({ prefix: "/api/v1/missions" })
		.use(companyScopeGuard({ allowHeaderFallback: false }))
		.onBeforeHandle(rejectForeignCompanyId)
		.post(
			"/",
			async ({ body, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.create(body, companyContext),
					201,
				);
			},
			{
				body: CreateMissionSchema,
				detail: { tags: ["Missions"], summary: "Create a new mission" },
			},
		)
		.get(
			"/:id",
			async ({ params, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.get(params.id, companyContext),
				);
			},
			{
				params: MissionIdParams,
				detail: { tags: ["Missions"], summary: "Get mission snapshot" },
			},
		)
		.post(
			"/:id/execute",
			async ({ params, body, headers, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.execute(
						params.id,
						body,
						headers as Record<string, unknown>,
						companyContext,
					),
				);
			},
			{
				params: MissionIdParams,
				body: ExecuteMissionSchema,
				detail: { tags: ["Missions"], summary: "Execute mission (SSE stream)" },
			},
		)
		.post(
			"/:id/approve",
			async ({ params, body, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.approve(params.id, body, companyContext),
				);
			},
			{
				params: MissionIdParams,
				body: ApproveMissionSchema,
				detail: { tags: ["Missions"], summary: "Approve proposal" },
			},
		)
		.post(
			"/:id/reject",
			async ({ params, body, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.reject(params.id, body, companyContext),
				);
			},
			{
				params: MissionIdParams,
				body: RejectMissionSchema,
				detail: { tags: ["Missions"], summary: "Reject proposal" },
			},
		)
		.get(
			"/:id/gates",
			async ({ params, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.getGates(params.id, companyContext),
				);
			},
			{
				params: MissionIdParams,
				detail: { tags: ["Missions"], summary: "Get readiness gates" },
			},
		)
		.get(
			"/:id/exceptions",
			async ({ params, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.getExceptions(params.id, companyContext),
				);
			},
			{
				params: MissionIdParams,
				detail: { tags: ["Missions"], summary: "Get accounting exceptions" },
			},
		)
		.get(
			"/:id/receipt/verify",
			async ({ params, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.verifyReceipt(params.id, companyContext),
				);
			},
			{
				params: MissionIdParams,
				detail: { tags: ["Missions"], summary: "Verify receipt integrity" },
			},
		)
		.post(
			"/:id/reconcile",
			async ({ params, body, set, companyContext }) => {
				return sendMissionResult(
					set,
					await ctrl.reconcile(params.id, body, companyContext),
				);
			},
			{
				params: MissionIdParams,
				body: ReconcileMissionSchema,
				detail: { tags: ["Missions"], summary: "Reconcile UNKNOWN state" },
			},
		);
};
