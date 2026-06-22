import { t } from "elysia";

/**
 * Query schema for GET /api/ai-swarm/observability/runs
 */
export const ListRunsQuerySchema = t.Object({
  limit: t.Optional(t.String({ default: "25", description: "Max results (1–100)" })),
  status: t.Optional(
    t.Union([
      t.Literal("running"),
      t.Literal("completed"),
      t.Literal("failed"),
      t.Literal("manual_review"),
      t.Literal("degraded"),
    ]),
  ),
  offset: t.Optional(t.String({ default: "0", description: "Pagination offset" })),
});

/**
 * Params schema for GET /api/ai-swarm/observability/runs/:runId/events
 */
export const ListEventsParamsSchema = t.Object({
  runId: t.String({ description: "UUID of the agent run" }),
});

/**
 * Query schema for GET /api/ai-swarm/observability/runs/:runId/events
 */
export const ListEventsQuerySchema = t.Object({
  limit: t.Optional(t.String({ default: "50", description: "Max events (1–200)" })),
});

// Batch schemas
export const CreateBatchBodyOpenApi = t.Object({
  invoices: t.Array(
    t.Object({
      type: t.Union([t.Literal("image"), t.Literal("pdf"), t.Literal("xml")]),
      data: t.String(),
      metadata: t.Optional(t.Record(t.String(), t.Unknown())),
    }),
  ),
  maxConcurrent: t.Optional(t.Numeric({ default: 3 })),
});

export const BatchParamsOpenApi = t.Object({
  batchId: t.String({ format: "uuid" }),
});

export const BatchListQueryOpenApi = t.Object({
  limit: t.Optional(t.Numeric({ default: 20 })),
  offset: t.Optional(t.Numeric({ default: 0 })),
});

// Memory OpenAPI schemas
export const CompanyMemoryParamsOpenApi = t.Object({
  companyId: t.String({ format: "uuid", description: "UUID de la compañía" }),
});

export const MemoryHistoryParamsOpenApi = t.Object({
  companyId: t.String({ format: "uuid", description: "UUID de la compañía" }),
});
