import type { PgDatabase } from "drizzle-orm/pg-core";
import type { AgentRunEvent, AgentRunState, BatchItemData, BatchRunData, RunInput, RunStateFilter, StateSnapshot } from "./session.types";
import type { SessionStore } from "./session-store";
type DrizzleClient = PgDatabase<any, any, any>;
export declare class PostgresSessionStore implements SessionStore {
    private readonly db;
    constructor(db: DrizzleClient);
    saveRunState(runId: string, state: Partial<AgentRunState>): Promise<void>;
    getRunState(runId: string): Promise<AgentRunState | null>;
    listRunStates(filter: RunStateFilter): Promise<AgentRunState[]>;
    appendEvent(runId: string, event: AgentRunEvent): Promise<void>;
    getEvents(runId: string, limit?: number): Promise<AgentRunEvent[]>;
    updateRunState(runId: string, partial: Partial<AgentRunState>): Promise<void>;
    recoverRunState(runId: string): Promise<StateSnapshot | null>;
    saveInput(runId: string, inputType: string, inputData: string, checksum: string): Promise<void>;
    getInput(runId: string): Promise<RunInput | null>;
    createBatch(data: {
        id?: string;
        companyId: string;
        total: number;
    }): Promise<BatchRunData>;
    getBatch(batchId: string): Promise<BatchRunData | null>;
    listBatches(companyId: string, limit?: number, offset?: number): Promise<BatchRunData[]>;
    updateBatch(batchId: string, data: Partial<Pick<BatchRunData, "status" | "completed" | "failed" | "completedAt">>): Promise<BatchRunData>;
    createBatchItem(batchId: string, runId: string): Promise<BatchItemData>;
    updateBatchItem(itemId: string, data: Partial<Pick<BatchItemData, "status" | "error">>): Promise<BatchItemData>;
    getBatchItems(batchId: string): Promise<BatchItemData[]>;
    private mapToAgentRunState;
    private mapBatchRun;
    private mapBatchItem;
}
export {};
//# sourceMappingURL=postgres-store.d.ts.map