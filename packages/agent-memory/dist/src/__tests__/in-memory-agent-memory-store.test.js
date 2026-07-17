import { describe, expect, it } from "vitest";
import { InMemoryAgentMemoryStore } from "../in-memory-agent-memory-store";
import { createMemoryApi } from "../memory-api";
describe("InMemoryAgentMemoryStore", () => {
    it("saves memory records with generated ids and timestamps", async () => {
        const store = new InMemoryAgentMemoryStore();
        const record = await store.save({
            agentId: "finance",
            sessionId: "session-1",
            scope: {
                tenantId: "tenant-1",
                companyId: "company-1",
                ruc: "20123456789",
            },
            type: "decision",
            content: "Invoice requires manual review because IGV evidence is incomplete.",
            metadata: { confidence: 0.82, tags: ["invoice", "igv"] },
        });
        expect(record.id).toMatch(/^mem_/);
        expect(record.createdAt).toBeInstanceOf(Date);
        expect(record.updatedAt).toBeInstanceOf(Date);
        expect(record.scope.tenantId).toBe("tenant-1");
    });
    it("searches only inside the requested tenant/company/RUC scope", async () => {
        const store = new InMemoryAgentMemoryStore();
        await store.save({
            agentId: "finance",
            scope: {
                tenantId: "tenant-1",
                companyId: "company-1",
                ruc: "20123456789",
            },
            type: "fact",
            content: "BCP invoice matched",
            metadata: { tags: ["banking"] },
        });
        await store.save({
            agentId: "finance",
            scope: {
                tenantId: "tenant-2",
                companyId: "company-2",
                ruc: "20999999999",
            },
            type: "fact",
            content: "BCP invoice leaked",
            metadata: { tags: ["banking"] },
        });
        const results = await store.search({
            text: "BCP invoice",
            scope: {
                tenantId: "tenant-1",
                companyId: "company-1",
                ruc: "20123456789",
            },
        });
        expect(results).toHaveLength(1);
        expect(results[0]?.record.content).toBe("BCP invoice matched");
    });
    it("returns session records in creation order", async () => {
        const store = new InMemoryAgentMemoryStore();
        const scope = { tenantId: "tenant-1", companyId: "company-1" };
        await store.save({
            agentId: "drenyra",
            sessionId: "session-1",
            scope,
            type: "message",
            content: "first",
            metadata: {},
        });
        await store.save({
            agentId: "drenyra",
            sessionId: "session-1",
            scope,
            type: "message",
            content: "second",
            metadata: {},
        });
        const records = await store.getBySession("session-1", scope);
        expect(records.map((record) => record.content)).toEqual([
            "first",
            "second",
        ]);
    });
    it("exposes Engram-style mem_save, mem_search and mem_context helpers", async () => {
        const store = new InMemoryAgentMemoryStore();
        const api = createMemoryApi(store);
        const scope = {
            tenantId: "tenant-1",
            companyId: "company-1",
            ruc: "20123456789",
        };
        await api.mem_save({
            agentId: "compliance",
            sessionId: "session-42",
            scope,
            type: "decision",
            content: "SIRE audit requires human review due to unmatched CDR evidence.",
            metadata: { tags: ["sire", "cdr"], confidence: 0.74 },
        });
        const search = await api.mem_search({ text: "SIRE CDR", scope });
        const context = await api.mem_context({
            scope,
            sessionId: "session-42",
            text: "human review",
        });
        expect(search[0]?.record.agentId).toBe("compliance");
        expect(context.records).toHaveLength(1);
        expect(context.summary).toContain("SIRE audit requires human review");
    });
});
//# sourceMappingURL=in-memory-agent-memory-store.test.js.map