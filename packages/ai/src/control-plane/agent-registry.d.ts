import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { type AgentRegistryEntry, type TenantCompanyRucScope } from "./contracts";
type DrizzleDb = PostgresJsDatabase<any>;
export declare class AgentRegistry {
    private db;
    private cache;
    private hydrated;
    constructor(db: DrizzleDb);
    registerAgent(entry: AgentRegistryEntry): Promise<void>;
    getAgent(agentId: string): Promise<AgentRegistryEntry | null>;
    queryByScope(scope: TenantCompanyRucScope): Promise<AgentRegistryEntry[]>;
    queryByCapability(capability: string): Promise<AgentRegistryEntry[]>;
    updateAgent(agentId: string, partial: Partial<AgentRegistryEntry>): Promise<void>;
    deactivateAgent(agentId: string): Promise<void>;
    private invalidateCache;
    private hydrateCache;
    private mapRow;
}
export {};
//# sourceMappingURL=agent-registry.d.ts.map