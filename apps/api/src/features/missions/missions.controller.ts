import type {
	ApproveMissionCommand,
	CreateMissionCommand,
	ReconcileMissionCommand,
	RejectMissionCommand,
} from "@drenyra/mission-domain";
import { isMissionError } from "@drenyra/mission-domain";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import type { CompanyContext } from "../../shared/plugins/company-scope-guard";
import type { MissionsService } from "./missions.service";
import type { MissionEventStore } from "./sse/mission-event-store";
import { missionSSEStream } from "./sse/mission-sse.stream";

const logger = SecureLogger.namespace("MissionsController");

/**
 * Error result of a controller call. `status` is the HTTP status the route
 * must answer with; `sendMissionResult` moves it out of the body.
 */
export interface MissionFailure {
	success: false;
	status: number;
	error: { code: string; message: string; details?: unknown };
}

function notFound(): MissionFailure {
	return {
		success: false,
		status: 404,
		error: { code: "MISSION_NOT_FOUND", message: "Mission not found" },
	};
}

export class MissionsController {
	constructor(
		private readonly service: MissionsService,
		private readonly eventStore: MissionEventStore,
	) {}

	async create(
		body: Omit<CreateMissionCommand, "companyId"> & {
			companyId?: string | undefined;
			idempotencyKey?: string | undefined;
		},
		ctx: CompanyContext,
	) {
		try {
			const mission = await this.service.createMission(ctx.companyId, {
				companyId: ctx.companyId,
				fiscalPeriod: body.fiscalPeriod,
				intent: body.intent,
				input: body.input,
			});
			return { success: true as const, data: mission };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async get(id: string, ctx: CompanyContext) {
		try {
			const mission = await this.service.getMission(id, ctx.companyId);
			if (!mission) {
				return notFound();
			}
			return { success: true as const, data: mission };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async execute(
		id: string,
		body: { expectedMissionVersion: number },
		headers: Record<string, unknown>,
		ctx: CompanyContext,
	) {
		try {
			const mission = await this.service.executeMission(id, ctx.companyId, {
				expectedMissionVersion: body.expectedMissionVersion,
			});

			const lastEventId = (headers["last-event-id"] ??
				headers["Last-Event-ID"]) as string | undefined;
			const stream = missionSSEStream(
				this.eventStore,
				id,
				lastEventId ?? null,
				() => this.service.getMission(id, ctx.companyId),
			);

			return { success: true as const, data: mission, stream };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async approve(
		id: string,
		body: ApproveMissionCommand & { idempotencyKey?: string },
		ctx: CompanyContext,
	) {
		try {
			const mission = await this.service.approveMission(
				id,
				ctx.companyId,
				ctx.userId,
				{
					proposalId: body.proposalId,
					proposalVersion: body.proposalVersion,
					evidenceHash: body.evidenceHash,
					expectedMissionVersion: body.expectedMissionVersion,
				},
			);
			return { success: true as const, data: mission };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async reject(
		id: string,
		body: RejectMissionCommand & { idempotencyKey?: string },
		ctx: CompanyContext,
	) {
		try {
			const mission = await this.service.rejectMission(
				id,
				ctx.companyId,
				ctx.userId,
				{
					proposalId: body.proposalId,
					proposalVersion: body.proposalVersion,
					reason: body.reason,
					expectedMissionVersion: body.expectedMissionVersion,
				},
			);
			return { success: true as const, data: mission };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async reconcile(
		id: string,
		body: ReconcileMissionCommand & { idempotencyKey?: string },
		ctx: CompanyContext,
	) {
		try {
			const mission = await this.service.reconcileMission(
				id,
				ctx.companyId,
				ctx.userId,
				{
					resolution: body.resolution,
					reason: body.reason,
					expectedMissionVersion: body.expectedMissionVersion,
				},
			);
			return { success: true as const, data: mission };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async getGates(id: string, ctx: CompanyContext) {
		try {
			const mission = await this.service.getMission(id, ctx.companyId);
			if (!mission) {
				return notFound();
			}
			return { success: true as const, data: (mission as any).gates ?? [] };
		} catch (error) {
			return this.handleError(error);
		}
	}

	async getExceptions(id: string, ctx: CompanyContext) {
		try {
			const mission = await this.service.getMission(id, ctx.companyId);
			if (!mission) {
				return notFound();
			}
			return {
				success: true as const,
				data: (mission as any).exceptions ?? [],
			};
		} catch (error) {
			return this.handleError(error);
		}
	}

	async verifyReceipt(id: string, ctx: CompanyContext) {
		try {
			const mission = await this.service.getMission(id, ctx.companyId);
			if (!mission) {
				return notFound();
			}
			const receipt = (mission as any).receiptHash
				? {
						valid: true,
						receiptHash: (mission as any).receiptHash,
						missionId: id,
					}
				: { valid: false, receiptHash: null, missionId: id };
			return { success: true as const, data: receipt };
		} catch (error) {
			return this.handleError(error);
		}
	}

	private handleError(error: unknown): MissionFailure {
		if (isMissionError(error)) {
			return {
				success: false,
				status: error.statusCode,
				error: {
					code: error.code,
					message: error.message,
					details: error.details,
				},
			};
		}
		// Unexpected errors (DB, driver, bugs) are logged, never echoed: their
		// messages can expose table names or query details.
		logger.error("Unexpected mission error", error);
		return {
			success: false,
			status: 500,
			error: { code: "INTERNAL_ERROR", message: "Internal server error" },
		};
	}
}
