import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { createMissionMemoryRecorder } from "./mission-memory.recorder";
import { MissionsController } from "./missions.controller";
import { MissionsService } from "./missions.service";
import {
	ApproveMissionSchema,
	CreateMissionSchema,
	ExecuteMissionSchema,
	ReconcileMissionSchema,
	RejectMissionSchema,
} from "./schema/mission.schema";
import { MissionEventStore } from "./sse/mission-event-store";

export const createMissionsRoutes = (db: any) => {
	const service = new MissionsService(
		db,
		undefined,
		undefined,
		createMissionMemoryRecorder(),
	);
	const eventStore = new MissionEventStore(db);
	const ctrl = new MissionsController(service, eventStore);

	return new Elysia({ prefix: "/api/v1/missions" })
		.use(companyScopeGuard({ allowHeaderFallback: false }))
		.post(
			"/",
			async ({ body, set, companyContext }) => {
				const result = await ctrl.create(body, companyContext);
				if (result.success) set.status = 201;
				else set.status = 400;
				return result;
			},
			{
				body: CreateMissionSchema,
				detail: { tags: ["Missions"], summary: "Create a new mission" },
			},
		)
		.get(
			"/:id",
			async ({ params, companyContext }) => {
				const result = await ctrl.get(params.id, companyContext);
				return result;
			},
			{
				params: t.Object({ id: t.String() }),
				detail: { tags: ["Missions"], summary: "Get mission snapshot" },
			},
		)
		.post(
			"/:id/execute",
			async ({ params, body, headers, companyContext }) => {
				return ctrl.execute(
					params.id,
					body,
					headers as Record<string, unknown>,
					companyContext,
				);
			},
			{
				params: t.Object({ id: t.String() }),
				body: ExecuteMissionSchema,
				detail: { tags: ["Missions"], summary: "Execute mission (SSE stream)" },
			},
		)
		.post(
			"/:id/approve",
			async ({ params, body, companyContext }) => {
				return ctrl.approve(params.id, body, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				body: ApproveMissionSchema,
				detail: { tags: ["Missions"], summary: "Approve proposal" },
			},
		)
		.post(
			"/:id/reject",
			async ({ params, body, companyContext }) => {
				return ctrl.reject(params.id, body, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				body: RejectMissionSchema,
				detail: { tags: ["Missions"], summary: "Reject proposal" },
			},
		)
		.get(
			"/:id/gates",
			async ({ params, companyContext }) => {
				return ctrl.getGates(params.id, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				detail: { tags: ["Missions"], summary: "Get readiness gates" },
			},
		)
		.get(
			"/:id/exceptions",
			async ({ params, companyContext }) => {
				return ctrl.getExceptions(params.id, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				detail: { tags: ["Missions"], summary: "Get accounting exceptions" },
			},
		)
		.get(
			"/:id/receipt/verify",
			async ({ params, companyContext }) => {
				return ctrl.verifyReceipt(params.id, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				detail: { tags: ["Missions"], summary: "Verify receipt integrity" },
			},
		)
		.post(
			"/:id/reconcile",
			async ({ params, body, companyContext }) => {
				return ctrl.reconcile(params.id, body, companyContext);
			},
			{
				params: t.Object({ id: t.String() }),
				body: ReconcileMissionSchema,
				detail: { tags: ["Missions"], summary: "Reconcile UNKNOWN state" },
			},
		);
};
