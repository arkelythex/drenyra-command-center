import type { CompanyContext } from "../../shared/plugins/company-scope-guard";
import type { MissionsService } from "./missions.service";
import type { MissionEventStore } from "./sse/mission-event-store";
import { missionSSEStream } from "./sse/mission-sse.stream";
import { isMissionError } from "@drenyra/mission-domain";
import type { RunIntentCommand, ApproveCommand, RejectCommand, ReconcileCommand } from "@drenyra/mission-domain";

export class MissionsController {
  constructor(
    private readonly service: MissionsService,
    private readonly eventStore: MissionEventStore,
  ) {}

  async create(body: RunIntentCommand & { idempotencyKey?: string }, ctx: CompanyContext) {
    try {
      const mission = await this.service.createMission(ctx.companyId, {
        companyId: ctx.companyId,
        fiscalPeriod: body.fiscalPeriod,
        intent: body.intent,
        input: body.input,
      });
      return { success: true, data: mission };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async get(id: string, ctx: CompanyContext) {
    try {
      const mission = await this.service.getMission(id, ctx.companyId);
      if (!mission) {
        return { success: false, error: { code: "MISSION_NOT_FOUND", message: "Mission not found" } };
      }
      return { success: true, data: mission };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async execute(id: string, body: { expectedMissionVersion: number }, headers: Record<string, unknown>, ctx: CompanyContext) {
    try {
      const mission = await this.service.executeMission(id, ctx.companyId, {
        expectedMissionVersion: body.expectedMissionVersion,
      });

      const lastEventId = (headers["last-event-id"] ?? headers["Last-Event-ID"]) as string | undefined;
      const stream = missionSSEStream(
        this.eventStore,
        id,
        lastEventId ?? null,
        () => this.service.getMission(id, ctx.companyId),
      );

      return { success: true, data: mission, stream };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async approve(id: string, body: ApproveCommand & { idempotencyKey?: string }, ctx: CompanyContext) {
    try {
      const mission = await this.service.approveMission(id, ctx.companyId, ctx.userId, {
        proposalId: body.proposalId,
        proposalVersion: body.proposalVersion,
        evidenceHash: body.evidenceHash,
        expectedMissionVersion: body.expectedMissionVersion,
      });
      return { success: true, data: mission };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async reject(id: string, body: RejectCommand & { idempotencyKey?: string }, ctx: CompanyContext) {
    try {
      const mission = await this.service.rejectMission(id, ctx.companyId, ctx.userId, {
        proposalId: body.proposalId,
        proposalVersion: body.proposalVersion,
        reason: body.reason,
        expectedMissionVersion: body.expectedMissionVersion,
      });
      return { success: true, data: mission };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async reconcile(id: string, body: ReconcileCommand & { idempotencyKey?: string }, ctx: CompanyContext) {
    try {
      const mission = await this.service.reconcileMission(id, ctx.companyId, ctx.userId, {
        resolution: body.resolution,
        reason: body.reason,
        expectedMissionVersion: body.expectedMissionVersion,
      });
      return { success: true, data: mission };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (isMissionError(error)) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}
