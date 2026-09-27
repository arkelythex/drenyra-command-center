import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { type RiskTier, type ToolDefinition, type ToolRegistration, type ToolScope } from "./contracts";
type DrizzleDb = PostgresJsDatabase<any>;
export declare class ToolRegistry {
    private db;
    private cache;
    private hydrated;
    constructor(db: DrizzleDb);
    registerTool(def: ToolRegistration): Promise<ToolDefinition>;
    getTool(name: string): Promise<ToolDefinition | null>;
    listToolsByRiskTier(tier: RiskTier): Promise<ToolDefinition[]>;
    listToolsByScope(_scope: ToolScope): Promise<ToolDefinition[]>;
    getAllTools(): Promise<ToolDefinition[]>;
    updateTool(name: string, partial: Partial<ToolRegistration>): Promise<void>;
    deleteTool(name: string): Promise<void>;
    private invalidateCache;
    private hydrateCache;
    private mapRow;
}
export {};
//# sourceMappingURL=tool-registry.d.ts.map