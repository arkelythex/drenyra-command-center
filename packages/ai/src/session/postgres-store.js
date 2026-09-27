import { agentRunEvents, agentRunInputs, agentRunStates, batchRunItems, batchRuns, } from "@drenyra/persistence/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { SessionNotFoundError, SessionStoreError } from "./session.types";
export class PostgresSessionStore {
    db;
    constructor(db) {
        this.db = db;
    }
    async saveRunState(runId, state) {
        try {
            await this.db
                .insert(agentRunStates)
                .values({
                runId,
                companyId: state.companyId ?? "",
                sessionId: state.sessionId ?? null,
                workflowState: state.workflowState ?? null,
                agentMetrics: state.agentMetrics ?? null,
                context: state.context ?? null,
                status: state.status ?? "running",
                error: state.error ?? null,
                startedAt: state.startedAt ?? new Date(),
                completedAt: state.completedAt ?? null,
            })
                .onConflictDoUpdate({
                target: agentRunStates.runId,
                set: {
                    workflowState: sql `COALESCE(excluded.workflow_state, ${agentRunStates.workflowState})`,
                    agentMetrics: sql `CASE WHEN excluded.agent_metrics IS NOT NULL THEN excluded.agent_metrics ELSE ${agentRunStates.agentMetrics} END`,
                    context: sql `CASE WHEN excluded.context IS NOT NULL THEN excluded.context ELSE ${agentRunStates.context} END`,
                    status: sql `COALESCE(excluded.status, ${agentRunStates.status})`,
                    error: sql `CASE WHEN excluded.error IS NOT NULL THEN excluded.error ELSE ${agentRunStates.error} END`,
                    completedAt: sql `COALESCE(excluded.completed_at, ${agentRunStates.completedAt})`,
                    updatedAt: new Date(),
                },
            });
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to save run state: ${runId}`, cause);
        }
    }
    async getRunState(runId) {
        try {
            const rows = await this.db
                .select()
                .from(agentRunStates)
                .where(eq(agentRunStates.runId, runId))
                .limit(1);
            if (rows.length === 0)
                return null;
            return this.mapToAgentRunState(rows[0]);
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to get run state: ${runId}`, cause);
        }
    }
    async listRunStates(filter) {
        try {
            const conditions = [eq(agentRunStates.companyId, filter.companyId)];
            if (filter.status) {
                conditions.push(eq(agentRunStates.status, filter.status));
            }
            if (filter.sessionId) {
                conditions.push(eq(agentRunStates.sessionId, filter.sessionId));
            }
            const rows = await this.db
                .select()
                .from(agentRunStates)
                .where(and(...conditions))
                .orderBy(desc(agentRunStates.createdAt))
                .limit(filter.limit ?? 20)
                .offset(filter.offset ?? 0);
            return rows.map((row) => this.mapToAgentRunState(row));
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to list run states for company: ${filter.companyId}`, cause);
        }
    }
    async appendEvent(runId, event) {
        try {
            await this.db.insert(agentRunEvents).values({
                runId: event.runId,
                eventType: event.eventType,
                payload: (event.payload ?? null),
                companyId: event.companyId,
            });
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to append event for run: ${runId}`, cause);
        }
    }
    async getEvents(runId, limit) {
        try {
            const rows = await this.db
                .select()
                .from(agentRunEvents)
                .where(eq(agentRunEvents.runId, runId))
                .orderBy(asc(agentRunEvents.createdAt))
                .limit(limit ?? 100);
            return rows.map((row) => ({
                id: row.id,
                runId: row.runId,
                eventType: row.eventType,
                payload: row.payload,
                companyId: row.companyId,
                createdAt: row.createdAt,
            }));
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to get events for run: ${runId}`, cause);
        }
    }
    async updateRunState(runId, partial) {
        try {
            const updateData = {
                updatedAt: new Date(),
            };
            if (partial.workflowState !== undefined)
                updateData.workflowState = partial.workflowState;
            if (partial.agentMetrics !== undefined)
                updateData.agentMetrics = partial.agentMetrics;
            if (partial.context !== undefined)
                updateData.context = partial.context;
            if (partial.status !== undefined)
                updateData.status = partial.status;
            if (partial.error !== undefined)
                updateData.error = partial.error;
            if (partial.completedAt !== undefined)
                updateData.completedAt = partial.completedAt;
            if (partial.sessionId !== undefined)
                updateData.sessionId = partial.sessionId;
            const result = await this.db
                .update(agentRunStates)
                .set(updateData)
                .where(eq(agentRunStates.runId, runId));
            if (!result) {
                throw new SessionNotFoundError(runId);
            }
        }
        catch (cause) {
            if (cause instanceof SessionNotFoundError)
                throw cause;
            throw new SessionStoreError(`Failed to update run state: ${runId}`, cause);
        }
    }
    async recoverRunState(runId) {
        try {
            const [state, events] = await Promise.all([
                this.getRunState(runId),
                this.getEvents(runId, 50),
            ]);
            if (!state)
                return null;
            return { state, events };
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to recover run state: ${runId}`, cause);
        }
    }
    async saveInput(runId, inputType, inputData, checksum) {
        try {
            await this.db
                .insert(agentRunInputs)
                .values({
                runId,
                inputType,
                inputData,
                checksum,
            })
                .onConflictDoUpdate({
                target: agentRunInputs.runId,
                set: {
                    inputType: sql `EXCLUDED.input_type`,
                    inputData: sql `EXCLUDED.input_data`,
                    checksum: sql `EXCLUDED.checksum`,
                },
            });
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to save input for run: ${runId}`, cause);
        }
    }
    async getInput(runId) {
        try {
            const rows = await this.db
                .select()
                .from(agentRunInputs)
                .where(eq(agentRunInputs.runId, runId))
                .limit(1);
            if (rows.length === 0)
                return null;
            const row = rows[0];
            return {
                runId: row.runId,
                inputType: row.inputType,
                inputData: row.inputData,
                checksum: row.checksum,
                createdAt: row.createdAt,
            };
        }
        catch (cause) {
            throw new SessionStoreError(`Failed to get input for run: ${runId}`, cause);
        }
    }
    async createBatch(data) {
        try {
            const [row] = await this.db
                .insert(batchRuns)
                .values({
                id: data.id ?? crypto.randomUUID(),
                companyId: data.companyId,
                status: "pending",
                total: data.total,
                completed: 0,
                failed: 0,
            })
                .returning();
            if (!row)
                throw new Error("Insert returned no row");
            return this.mapBatchRun(row);
        }
        catch (error) {
            throw new SessionStoreError("Failed to create batch", { cause: error });
        }
    }
    async getBatch(batchId) {
        try {
            const rows = await this.db
                .select()
                .from(batchRuns)
                .where(eq(batchRuns.id, batchId))
                .limit(1);
            return rows[0] ? this.mapBatchRun(rows[0]) : null;
        }
        catch (error) {
            throw new SessionStoreError(`Failed to get batch ${batchId}`, {
                cause: error,
            });
        }
    }
    async listBatches(companyId, limit = 20, offset = 0) {
        try {
            const rows = await this.db
                .select()
                .from(batchRuns)
                .where(eq(batchRuns.companyId, companyId))
                .orderBy(desc(batchRuns.createdAt))
                .limit(limit)
                .offset(offset);
            return rows.map(this.mapBatchRun);
        }
        catch (error) {
            throw new SessionStoreError(`Failed to list batches for ${companyId}`, {
                cause: error,
            });
        }
    }
    async updateBatch(batchId, data) {
        try {
            const [row] = await this.db
                .update(batchRuns)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(batchRuns.id, batchId))
                .returning();
            if (!row)
                throw new Error("Batch not found");
            return this.mapBatchRun(row);
        }
        catch (error) {
            throw new SessionStoreError(`Failed to update batch ${batchId}`, {
                cause: error,
            });
        }
    }
    async createBatchItem(batchId, runId) {
        try {
            const [row] = await this.db
                .insert(batchRunItems)
                .values({
                batchId,
                runId,
                status: "pending",
            })
                .returning();
            if (!row)
                throw new Error("Insert returned no row");
            return this.mapBatchItem(row);
        }
        catch (error) {
            throw new SessionStoreError(`Failed to create batch item for ${runId}`, {
                cause: error,
            });
        }
    }
    async updateBatchItem(itemId, data) {
        try {
            const [row] = await this.db
                .update(batchRunItems)
                .set(data)
                .where(eq(batchRunItems.id, itemId))
                .returning();
            if (!row)
                throw new Error("Batch item not found");
            return this.mapBatchItem(row);
        }
        catch (error) {
            throw new SessionStoreError(`Failed to update batch item ${itemId}`, {
                cause: error,
            });
        }
    }
    async getBatchItems(batchId) {
        try {
            const rows = await this.db
                .select()
                .from(batchRunItems)
                .where(eq(batchRunItems.batchId, batchId))
                .orderBy(batchRunItems.createdAt);
            return rows.map(this.mapBatchItem);
        }
        catch (error) {
            throw new SessionStoreError(`Failed to get items for batch ${batchId}`, {
                cause: error,
            });
        }
    }
    mapToAgentRunState(row) {
        return {
            id: row.id,
            runId: row.runId,
            sessionId: row.sessionId ?? null,
            workflowState: row.workflowState ?? null,
            agentMetrics: row.agentMetrics ?? null,
            context: row.context ?? null,
            status: row.status,
            error: row.error ?? null,
            companyId: row.companyId,
            startedAt: row.startedAt,
            completedAt: row.completedAt ?? null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    mapBatchRun(row) {
        return {
            id: row.id,
            companyId: row.companyId,
            status: row.status,
            total: row.total,
            completed: row.completed,
            failed: row.failed,
            createdAt: row.createdAt,
            completedAt: row.completedAt,
            sessionId: null,
        };
    }
    mapBatchItem(row) {
        return {
            id: row.id,
            batchId: row.batchId,
            runId: row.runId ?? "",
            status: row.status,
            error: row.error,
            createdAt: row.createdAt,
        };
    }
}
//# sourceMappingURL=postgres-store.js.map