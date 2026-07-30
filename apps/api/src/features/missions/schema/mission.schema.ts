import { t } from "elysia";

export const CreateMissionSchema = t.Object({
  companyId: t.String({ format: "uuid" }),
  fiscalPeriod: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
  intent: t.Union([
    t.Literal("monthly-close"),
    t.Literal("reconciliation"),
    t.Literal("invoice-review"),
    t.Literal("compliance-check"),
  ]),
  input: t.Object({ instruction: t.String({ minLength: 1 }) }),
  idempotencyKey: t.Optional(t.String({ minLength: 1 })),
});

export const ExecuteMissionSchema = t.Object({
  expectedMissionVersion: t.Number({ minimum: 1 }),
});

export const ApproveMissionSchema = t.Object({
  proposalId: t.String({ format: "uuid" }),
  proposalVersion: t.Number({ minimum: 1 }),
  evidenceHash: t.String({ minLength: 64, maxLength: 64 }),
  expectedMissionVersion: t.Number({ minimum: 1 }),
});

export const RejectMissionSchema = t.Object({
  proposalId: t.String({ format: "uuid" }),
  proposalVersion: t.Number({ minimum: 1 }),
  reason: t.String({ minLength: 1, maxLength: 2000 }),
  expectedMissionVersion: t.Number({ minimum: 1 }),
});

export const ReconcileMissionSchema = t.Object({
  resolution: t.Union([
    t.Literal("RUNNING"),
    t.Literal("FAILED"),
    t.Literal("COMPLETED"),
  ]),
  reason: t.String({ minLength: 1, maxLength: 2000 }),
  expectedMissionVersion: t.Number({ minimum: 1 }),
});
