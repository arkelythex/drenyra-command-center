import { aiTools } from "@drenyra/persistence/schema";
import { eq } from "drizzle-orm";
import { zodToolSchema } from "../tools/json-schema";
import { ToolRegistrationSchema, } from "./contracts";
export class ToolRegistry {
    db;
    cache = new Map();
    hydrated = false;
    constructor(db) {
        this.db = db;
    }
    async registerTool(def) {
        const parsed = ToolRegistrationSchema.parse(def);
        let resolvedInputSchema = null;
        if (parsed.zodSchema !== undefined) {
            resolvedInputSchema = zodToolSchema(parsed.zodSchema);
        }
        else if (parsed.inputSchema !== undefined) {
            resolvedInputSchema = parsed.inputSchema;
        }
        const values = {
            name: parsed.name,
            description: parsed.description ?? null,
            riskTier: parsed.riskTier,
            inputSchema: resolvedInputSchema,
            outputSchema: parsed.outputSchema ?? null,
            requiresApproval: parsed.requiresApproval ?? false,
            fiscalImpact: parsed.fiscalImpact ?? false,
            approvalLevel: parsed.approvalLevel ?? "auto",
        };
        const [row] = await this.db
            .insert(aiTools)
            .values(values)
            .onConflictDoUpdate({
            target: aiTools.name,
            set: {
                description: values.description,
                riskTier: values.riskTier,
                inputSchema: values.inputSchema,
                outputSchema: values.outputSchema,
                requiresApproval: values.requiresApproval,
                fiscalImpact: values.fiscalImpact,
                approvalLevel: values.approvalLevel,
                updatedAt: new Date(),
            },
        })
            .returning();
        const tool = this.mapRow(row);
        this.cache.set(tool.name, tool);
        return tool;
    }
    async getTool(name) {
        if (this.cache.has(name)) {
            return this.cache.get(name) ?? null;
        }
        await this.hydrateCache();
        return this.cache.get(name) ?? null;
    }
    async listToolsByRiskTier(tier) {
        const rows = await this.db
            .select()
            .from(aiTools)
            .where(eq(aiTools.riskTier, tier));
        const tools = rows.map(this.mapRow);
        return tools;
    }
    async listToolsByScope(_scope) {
        return this.getAllTools();
    }
    async getAllTools() {
        const rows = await this.db.select().from(aiTools);
        return rows.map(this.mapRow);
    }
    async updateTool(name, partial) {
        const setData = {};
        if (partial.description !== undefined) {
            setData.description = partial.description;
        }
        if (partial.riskTier !== undefined) {
            setData.riskTier = partial.riskTier;
        }
        if (partial.inputSchema !== undefined) {
            setData.inputSchema = partial.inputSchema;
        }
        if (partial.outputSchema !== undefined) {
            setData.outputSchema = partial.outputSchema;
        }
        if (partial.requiresApproval !== undefined) {
            setData.requiresApproval = partial.requiresApproval;
        }
        if (partial.fiscalImpact !== undefined) {
            setData.fiscalImpact = partial.fiscalImpact;
        }
        if (partial.approvalLevel !== undefined) {
            setData.approvalLevel = partial.approvalLevel;
        }
        setData.updatedAt = new Date();
        await this.db.update(aiTools).set(setData).where(eq(aiTools.name, name));
        this.invalidateCache(name);
    }
    async deleteTool(name) {
        await this.db.delete(aiTools).where(eq(aiTools.name, name));
        this.invalidateCache(name);
    }
    invalidateCache(name) {
        this.cache.delete(name);
    }
    async hydrateCache() {
        if (this.hydrated) {
            return;
        }
        const rows = await this.db.select().from(aiTools);
        for (const row of rows) {
            this.cache.set(row.name, this.mapRow(row));
        }
        this.hydrated = true;
    }
    mapRow(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            riskTier: row.riskTier,
            inputSchema: row.inputSchema,
            outputSchema: row.outputSchema,
            requiresApproval: row.requiresApproval,
            fiscalImpact: row.fiscalImpact,
            approvalLevel: row.approvalLevel,
            metadata: row.metadata,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
//# sourceMappingURL=tool-registry.js.map