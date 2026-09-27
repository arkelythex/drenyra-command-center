import { aiAgents } from "@drenyra/persistence/schema";
import { and, eq, sql } from "drizzle-orm";
import { AgentRegistryEntrySchema, } from "./contracts";
export class AgentRegistry {
    db;
    cache = new Map();
    hydrated = false;
    constructor(db) {
        this.db = db;
    }
    async registerAgent(entry) {
        const parsed = AgentRegistryEntrySchema.parse(entry);
        const values = {
            agentId: parsed.agentId,
            purpose: parsed.purpose,
            tenantId: parsed.tenantScope.tenantId,
            organizationId: parsed.tenantScope.organizationId,
            companyId: parsed.tenantScope.companyId,
            ruc: parsed.tenantScope.ruc,
            capabilities: parsed.capabilities,
            allowedTools: parsed.allowedTools,
            approvalClass: parsed.approvalClass,
            supportedSurfaces: parsed.supportedSurfaces,
        };
        await this.db
            .insert(aiAgents)
            .values(values)
            .onConflictDoUpdate({
            target: aiAgents.agentId,
            set: {
                purpose: values.purpose,
                tenantId: values.tenantId,
                organizationId: values.organizationId,
                companyId: values.companyId,
                ruc: values.ruc,
                capabilities: values.capabilities,
                allowedTools: values.allowedTools,
                approvalClass: values.approvalClass,
                supportedSurfaces: values.supportedSurfaces,
                updatedAt: new Date(),
            },
        });
        this.cache.set(parsed.agentId, parsed);
    }
    async getAgent(agentId) {
        if (this.cache.has(agentId)) {
            return this.cache.get(agentId) ?? null;
        }
        await this.hydrateCache();
        return this.cache.get(agentId) ?? null;
    }
    async queryByScope(scope) {
        const rows = await this.db
            .select()
            .from(aiAgents)
            .where(and(eq(aiAgents.tenantId, scope.tenantId), eq(aiAgents.organizationId, scope.organizationId), eq(aiAgents.companyId, scope.companyId), eq(aiAgents.ruc, scope.ruc), eq(aiAgents.isActive, true)));
        return rows.map(this.mapRow);
    }
    async queryByCapability(capability) {
        const rows = await this.db
            .select()
            .from(aiAgents)
            .where(and(sql `${aiAgents.capabilities} @> ARRAY[${capability}]::text[]`, eq(aiAgents.isActive, true)));
        return rows.map(this.mapRow);
    }
    async updateAgent(agentId, partial) {
        const setData = {};
        if (partial.purpose !== undefined) {
            setData.purpose = partial.purpose;
        }
        if (partial.capabilities !== undefined) {
            setData.capabilities = partial.capabilities;
        }
        if (partial.allowedTools !== undefined) {
            setData.allowedTools = partial.allowedTools;
        }
        if (partial.approvalClass !== undefined) {
            setData.approvalClass = partial.approvalClass;
        }
        if (partial.supportedSurfaces !== undefined) {
            setData.supportedSurfaces = partial.supportedSurfaces;
        }
        setData.updatedAt = new Date();
        await this.db
            .update(aiAgents)
            .set(setData)
            .where(eq(aiAgents.agentId, agentId));
        this.invalidateCache(agentId);
    }
    async deactivateAgent(agentId) {
        await this.db
            .update(aiAgents)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(aiAgents.agentId, agentId));
        this.invalidateCache(agentId);
    }
    invalidateCache(agentId) {
        this.cache.delete(agentId);
    }
    async hydrateCache() {
        if (this.hydrated) {
            return;
        }
        const rows = await this.db.select().from(aiAgents);
        for (const row of rows) {
            this.cache.set(row.agentId, this.mapRow(row));
        }
        this.hydrated = true;
    }
    mapRow(row) {
        return {
            agentId: row.agentId,
            purpose: row.purpose ?? "",
            tenantScope: {
                tenantId: row.tenantId ?? "",
                organizationId: row.organizationId ?? "",
                companyId: row.companyId ?? "",
                ruc: row.ruc ?? "",
            },
            capabilities: (row.capabilities ??
                []),
            allowedTools: row.allowedTools ?? [],
            approvalClass: row.approvalClass,
            supportedSurfaces: (row.supportedSurfaces ??
                []),
        };
    }
}
//# sourceMappingURL=agent-registry.js.map