import { Elysia } from "elysia";
import { z } from "zod";
import { AiObservabilityService } from "./observability.service";
import {
  ListRunsQuerySchema as ListRunsOpenApiSchema,
  ListEventsParamsSchema as ListEventsParamsOpenApiSchema,
  ListEventsQuerySchema as ListEventsQueryOpenApiSchema,
  CompanyMemoryParamsOpenApi,
  MemoryHistoryParamsOpenApi,
} from "./observability.schema";
import {
  ListRunsQuerySchema,
  ListEventsParamsSchema,
  ListEventsQuerySchema,
  CreateBatchBodySchema,
  BatchListQuerySchema,
  BatchParamsSchema,
  BatchCancelParamsSchema,
  CompanyMemoryParamsSchema,
} from "./observability.schemas";
import {
  CreateBatchBodyOpenApi,
  BatchParamsOpenApi,
  BatchListQueryOpenApi,
} from "./observability.schema";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { authorizeOperation } from "../../security/rbac-guard";

function validationErrorResponse(error: z.ZodError<unknown>) {
  return fail("Invalid observability request parameters", "VALIDATION_ERROR", {
    details: {
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    },
  });
}

export const aiObservabilityModule = new Elysia({
  prefix: "/observability",
})
  .get("/summary", async ({ headers, set }) => {
    const authz = await authorizeOperation({
      headers: headers as Record<string, unknown>,
      operation: "observability:runs:read",
      resource: "/api/ai-swarm/observability/summary",
    });
    if (!authz.ok) {
      set.status = authz.status;
      return fail(authz.error, authz.code);
    }

    try {
      const data = await AiObservabilityService.getSummary(authz.actor.companyId);
      return ok(data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), "INTERNAL_ERROR");
    }
  }, {
    detail: {
      tags: ["AI Swarm"],
      summary: "Obtener resumen de ejecuciones de agentes",
    },
  })

  .get("/runs", async ({ query, headers, set }) => {
    const parsedQuery = ListRunsQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 422;
      return validationErrorResponse(parsedQuery.error);
    }

    const authz = await authorizeOperation({
      headers: headers as Record<string, unknown>,
      operation: "observability:runs:read",
      resource: "/api/ai-swarm/observability/runs",
    });
    if (!authz.ok) {
      set.status = authz.status;
      return fail(authz.error, authz.code);
    }

    try {
      const data = await AiObservabilityService.listRuns(
        authz.actor.companyId,
        parsedQuery.data.limit,
        parsedQuery.data.status,
        parsedQuery.data.offset,
      );
      return ok(data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), "INTERNAL_ERROR");
    }
  }, {
    query: ListRunsOpenApiSchema,
    detail: {
      tags: ["AI Swarm"],
      summary: "Listar ejecuciones de agentes",
    },
  })

  // POST /observability/batch — submit batch
  .post(
    "/batch",
    async ({ body, headers, set }) => {
      const authz = await authorizeOperation({
        headers: headers as Record<string, unknown>,
        operation: "observability:batches:write",
        resource: "/api/ai-swarm/observability/batch",
      });
      if (!authz.ok) {
        set.status = authz.status;
        return { success: false, error: authz.error, code: authz.code };
      }

      const parsed = CreateBatchBodySchema.safeParse(body);
      if (!parsed.success) {
        set.status = 422;
        return { success: false, error: "Invalid request", details: parsed.error.issues };
      }
      try {
        const { batchId } = await AiObservabilityService.createBatch({
          companyId: authz.actor.companyId,
          total: parsed.data.invoices.length,
        });
        return { success: true, data: { batchId } };
      } catch (error) {
        set.status = 500;
        return { success: false, error: error instanceof Error ? error.message : "Internal error" };
      }
    },
    { body: CreateBatchBodyOpenApi, detail: { tags: ["Observability"], summary: "Submit batch" } },
  )

  // GET /observability/batches — list batches
  .get(
    "/batches",
    async ({ query, headers, set }) => {
      const authz = await authorizeOperation({
        headers: headers as Record<string, unknown>,
        operation: "observability:batches:read",
        resource: "/api/ai-swarm/observability/batches",
      });
      if (!authz.ok) {
        set.status = authz.status;
        return { success: false, error: authz.error, code: authz.code };
      }

      const parsed = BatchListQuerySchema.safeParse(query);
      if (!parsed.success) {
        set.status = 422;
        return { success: false, error: "Invalid request", details: parsed.error.issues };
      }
      try {
        const data = await AiObservabilityService.listBatches(
          authz.actor.companyId,
          parsed.data.limit,
          parsed.data.offset,
        );
        return { success: true, data };
      } catch (error) {
        set.status = 500;
        return { success: false, error: error instanceof Error ? error.message : "Internal error" };
      }
    },
    { query: BatchListQueryOpenApi, detail: { tags: ["Observability"], summary: "List batches" } },
  )

  // GET /observability/batches/:batchId — batch detail
  .get(
    "/batches/:batchId",
    async ({ params, headers, set }) => {
      const authz = await authorizeOperation({
        headers: headers as Record<string, unknown>,
        operation: "observability:batches:read",
        resource: "/api/ai-swarm/observability/batches/:batchId",
      });
      if (!authz.ok) {
        set.status = authz.status;
        return { success: false, error: authz.error, code: authz.code };
      }

      const parsed = BatchParamsSchema.safeParse(params);
      if (!parsed.success) {
        set.status = 422;
        return { success: false, error: "Invalid request", details: parsed.error.issues };
      }
      try {
        const data = await AiObservabilityService.getBatch(
          parsed.data.batchId,
          authz.actor.companyId,
        );
        if (!data) {
          set.status = 404;
          return { success: false, error: "Batch not found" };
        }
        return { success: true, data };
      } catch (error) {
        set.status = 500;
        return { success: false, error: error instanceof Error ? error.message : "Internal error" };
      }
    },
    { params: BatchParamsOpenApi, detail: { tags: ["Observability"], summary: "Get batch detail" } },
  )

  // POST /observability/batches/:batchId/cancel — cancel a batch
  .post(
    "/batches/:batchId/cancel",
    async ({ params, headers, set }) => {
      const authz = await authorizeOperation({
        headers: headers as Record<string, unknown>,
        operation: "observability:batches:write",
        resource: "/api/ai-swarm/observability/batches/:batchId/cancel",
      });
      if (!authz.ok) {
        set.status = authz.status;
        return { success: false, error: authz.error, code: authz.code };
      }

      const parsed = BatchCancelParamsSchema.safeParse(params);
      if (!parsed.success) {
        set.status = 422;
        return { success: false, error: "Invalid request", details: parsed.error.issues };
      }
      try {
        await AiObservabilityService.cancelBatch(parsed.data.batchId, authz.actor.companyId);
        return { success: true, data: { cancelled: true } };
      } catch (error) {
        if (error instanceof Error && error.message === "Batch not found") {
          set.status = 404;
          return { success: false, error: "Batch not found" };
        }
        set.status = 500;
        return { success: false, error: error instanceof Error ? error.message : "Internal error" };
      }
    },
    { detail: { tags: ["Observability"], summary: "Cancel a running batch" } },
  )

  .get("/runs/:runId/events", async ({ params, query, headers, set }) => {
    const parsedParams = ListEventsParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    const parsedQuery = ListEventsQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 422;
      return validationErrorResponse(parsedQuery.error);
    }

    const authz = await authorizeOperation({
      headers: headers as Record<string, unknown>,
      operation: "observability:runs:events:read",
      resource: "/api/ai-swarm/observability/runs/:runId/events",
    });
    if (!authz.ok) {
      set.status = authz.status;
      return fail(authz.error, authz.code);
    }

    try {
      const data = await AiObservabilityService.getRunEvents(
        parsedParams.data.runId,
        authz.actor.companyId,
        parsedQuery.data.limit,
      );
      return ok(data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), "INTERNAL_ERROR");
    }
  }, {
    params: ListEventsParamsOpenApiSchema,
    query: ListEventsQueryOpenApiSchema,
    detail: {
      tags: ["AI Swarm"],
      summary: "Obtener eventos de una ejecución de agente",
    },
  })

  // --- Memory Routes ---

  .get("/memory/:companyId", async ({ params, headers, set }) => {
    const parsedParams = CompanyMemoryParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    const authz = await authorizeOperation({
      headers: headers as Record<string, unknown>,
      operation: "observability:memory:read",
      resource: "/api/ai-swarm/observability/memory/:companyId",
      requestedCompanyId: parsedParams.data.companyId,
    });
    if (!authz.ok) {
      set.status = authz.status;
      return fail(authz.error, authz.code);
    }

    try {
      const data = await AiObservabilityService.getCompanyMemory(
        parsedParams.data.companyId,
      );
      return ok(data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), "INTERNAL_ERROR");
    }
  }, {
    params: CompanyMemoryParamsOpenApi,
    detail: {
      tags: ["AI Swarm"],
      summary: "Obtener contexto de memoria de agente para una compañía",
      description:
        "Retorna un resumen formateado de ejecuciones exitosas previas, listo para inyección en prompts de agente.",
    },
  })

  .get("/memory/:companyId/history", async ({ params, headers, set }) => {
    const parsedParams = CompanyMemoryParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    const authz = await authorizeOperation({
      headers: headers as Record<string, unknown>,
      operation: "observability:memory:read",
      resource: "/api/ai-swarm/observability/memory/:companyId/history",
      requestedCompanyId: parsedParams.data.companyId,
    });
    if (!authz.ok) {
      set.status = authz.status;
      return fail(authz.error, authz.code);
    }

    try {
      const data = await AiObservabilityService.getMemoryHistory(
        parsedParams.data.companyId,
      );
      return ok(data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), "INTERNAL_ERROR");
    }
  }, {
    params: MemoryHistoryParamsOpenApi,
    detail: {
      tags: ["AI Swarm"],
      summary: "Obtener historial cronológico de entradas de memoria",
      description:
        "Retorna entradas de memoria ordenadas cronológicamente para una compañía, filtrando ejecuciones completadas con memorySummary no nulo.",
    },
  });
