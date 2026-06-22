import { db } from "@arkelythex/persistence/client";
import { eq, and, desc, asc, sql } from "@arkelythex/persistence/query";
import {
  agentRunStates,
  agentRunEvents,
  batchRuns,
  batchRunItems,
} from "@arkelythex/persistence/schema";
import { MemoryContextProvider } from "@arkelythex/ai/memory";
import { PostgresSessionStore } from "@arkelythex/ai/session";
import { sanitizeAiObservationPayload } from "../api/ai-observability-sanitizer";

type AgentRunState = typeof agentRunStates.$inferSelect;
type AgentRunEvent = typeof agentRunEvents.$inferSelect;

export interface RunSummary {
  total: number;
  running: number;
  completed: number;
  failed: number;
  manualReview: number;
  degraded: number;
}

/**
 * AI Observability service — read-only queries for agent run states and events.
 *
 * @example
 * ```ts
 * const summary = await AiObservabilityService.getSummary();
 * const runs = await AiObservabilityService.listRuns(25, "running");
 * const events = await AiObservabilityService.getRunEvents(runId);
 * ```
 */
export class AiObservabilityService {
  /**
   * Returns a summary of agent run states for a given company, grouped by status.
   */
  static async getSummary(companyId: string): Promise<RunSummary> {
    const rows = await db
      .select({ status: agentRunStates.status, count: sql<number>`count(*)` })
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId))
      .groupBy(agentRunStates.status);

    const summary: RunSummary = {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      manualReview: 0,
      degraded: 0,
    };

    for (const row of rows) {
      const key = row.status as keyof RunSummary;
      if (key in summary) {
        summary[key] = Number(row.count);
        summary.total += Number(row.count);
      }
    }

    return summary;
  }

  /**
   * Lists agent runs for a given company with optional status filter, paginated.
   * Context field is sanitized to remove PII/fiscal data before returning.
   */
  static async listRuns(
    companyId: string,
    limit = 25,
    status?: string,
    offset = 0,
  ): Promise<AgentRunState[]> {
    const conditions = [eq(agentRunStates.companyId, companyId)];
    if (status) {
      conditions.push(eq(agentRunStates.status, status));
    }

    return await db.query.agentRunStates.findMany({
      where: and(...conditions),
      orderBy: [desc(agentRunStates.startedAt)],
      limit,
      offset,
    }).then(rows => rows.map(row => ({
      ...row,
      context: row.context ? sanitizeAiObservationPayload(row.context) as Record<string, unknown> : row.context,
    })));
  }

  /**
   * Returns events for a specific agent run, most recent first.
   * Verifies the run belongs to the given company and sanitizes payload.
   */
  static async getRunEvents(
    runId: string,
    companyId: string,
    limit = 50,
  ): Promise<AgentRunEvent[]> {
    // Verify the run belongs to the requesting company
    const run = await db.query.agentRunStates.findFirst({
      where: and(
        eq(agentRunStates.runId, runId),
        eq(agentRunStates.companyId, companyId),
      ),
      columns: { runId: true },
    });
    if (!run) return [];

    return await db.query.agentRunEvents.findMany({
      where: eq(agentRunEvents.runId, runId),
      orderBy: [desc(agentRunEvents.createdAt)],
      limit,
    }).then(rows => rows.map(row => ({
      ...row,
      payload: row.payload ? sanitizeAiObservationPayload(row.payload) as Record<string, unknown> : row.payload,
    })));
  }

  // --- Memory Methods ---

  /**
   * Returns the memory context for a company — a formatted summary of past
   * successful agent runs, plus the count of recent runs.
   *
   * Uses MemoryContextProvider to build a prompt-ready summary from completed
   * runs via the SessionStore.
   */
  static async getCompanyMemory(
    companyId: string,
  ): Promise<{ summary: string | null; recentRuns: number; companyId: string }> {
    const sessionStore = new PostgresSessionStore(db);
    const provider = new MemoryContextProvider(sessionStore);
    const context = await provider.getContext(companyId);

    if (!context) {
      return { summary: null, recentRuns: 0, companyId };
    }

    return {
      summary: context.summary,
      recentRuns: context.recentRuns,
      companyId: context.companyId,
    };
  }

  /**
   * Returns a chronological list of memory entries for a company.
   *
   * Queries the agent_run_states table for completed runs that have a
   * stored memorySummary in their context JSONB field, ordered by
   * completion date ascending.
   */
  static async getMemoryHistory(
    companyId: string,
  ): Promise<
    Array<{
      runId: string;
      memorySummary: string;
      workflowState: string;
      status: string;
      startedAt: string;
      completedAt: string;
    }>
  > {
    const rows = await db
      .select()
      .from(agentRunStates)
      .where(
        and(
          eq(agentRunStates.companyId, companyId),
          eq(agentRunStates.status, "completed"),
          sql`${agentRunStates.context}->>'memorySummary' IS NOT NULL`,
        ),
      )
      .orderBy(asc(agentRunStates.completedAt));

    return rows.map((row) => ({
      runId: row.runId,
      memorySummary: ((row.context as Record<string, unknown>)?.memorySummary as string) ?? "",
      workflowState: row.workflowState ?? "",
      status: row.status,
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? "",
    }));
  }

  // --- Batch Methods ---

  static async createBatch(data: {
    companyId: string;
    total: number;
  }): Promise<{ batchId: string }> {
    const [row] = await db.insert(batchRuns).values({
      companyId: data.companyId,
      status: "pending",
      total: data.total,
      completed: 0,
      failed: 0,
    }).returning({ id: batchRuns.id });
    if (!row) throw new Error("Failed to create batch");
    return { batchId: row.id };
  }

  static async getBatch(batchId: string, companyId: string): Promise<Record<string, unknown> | null> {
    const row = await db.query.batchRuns.findFirst({
      where: and(
        eq(batchRuns.id, batchId),
        eq(batchRuns.companyId, companyId),
      ),
      with: { items: true },
    });
    if (!row) return null;
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      items: (row.items as Array<{ id: string; batchId: string; runId: string; status: string; error: string | null; createdAt: Date }>).map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  static async listBatches(
    companyId: string,
    limit = 20,
    offset = 0,
  ): Promise<Record<string, unknown>[]> {
    const rows = await db.query.batchRuns.findMany({
      where: eq(batchRuns.companyId, companyId),
      orderBy: [desc(batchRuns.createdAt)],
      limit,
      offset,
    });
    return rows.map((row: { id: string; companyId: string; status: string; total: number; completed: number; failed: number; createdAt: Date; completedAt: Date | null }) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    }));
  }

  static async cancelBatch(batchId: string, companyId: string): Promise<void> {
    const [row] = await db.update(batchRuns)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(batchRuns.id, batchId),
          eq(batchRuns.companyId, companyId),
        ),
      )
      .returning({ id: batchRuns.id });
    if (!row) throw new Error("Batch not found");

    // Cancel all pending items
    await db.update(batchRunItems)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(batchRunItems.batchId, batchId),
          eq(batchRunItems.status, "pending"),
        ),
      );

    // Also cancel running items
    await db.update(batchRunItems)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(batchRunItems.batchId, batchId),
          eq(batchRunItems.status, "running"),
        ),
      );
  }
}
