import { SimpleSessionCondenser, } from "./session-condenser";
export class InMemoryAgentMemoryStore {
    condenser;
    records = [];
    sequence = 0;
    constructor(condenser = new SimpleSessionCondenser()) {
        this.condenser = condenser;
    }
    async save(input) {
        const now = new Date();
        this.sequence += 1;
        const record = {
            id: `mem_${this.sequence.toString().padStart(8, "0")}`,
            agentId: input.agentId,
            ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
            scope: { ...input.scope },
            type: input.type,
            content: input.content,
            metadata: { ...input.metadata },
            createdAt: now,
            updatedAt: now,
        };
        this.records.push(record);
        return cloneRecord(record);
    }
    async search(query) {
        const terms = tokenize(query.text);
        const limit = query.limit ?? 10;
        return this.records
            .filter((record) => isScopeMatch(record.scope, query.scope))
            .filter((record) => query.agentId === undefined || record.agentId === query.agentId)
            .map((record) => ({ record, score: scoreRecord(record, terms) }))
            .filter((result) => result.score > 0)
            .sort((left, right) => right.score - left.score ||
            left.record.createdAt.getTime() - right.record.createdAt.getTime())
            .slice(0, limit)
            .map((result) => ({
            record: cloneRecord(result.record),
            score: result.score,
        }));
    }
    async context(query) {
        const sessionRecords = query.sessionId === undefined
            ? []
            : await this.getBySession(query.sessionId, query.scope);
        const searchRecords = query.text === undefined
            ? []
            : (await this.search({
                text: query.text,
                scope: query.scope,
                limit: query.limit,
            })).map((result) => result.record);
        const records = uniqueRecords([...sessionRecords, ...searchRecords]).slice(0, query.limit ?? 10);
        return {
            records,
            summary: this.condenser.condense(records),
        };
    }
    async getBySession(sessionId, scope) {
        return this.records
            .filter((record) => record.sessionId === sessionId)
            .filter((record) => isScopeMatch(record.scope, scope))
            .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
            .map(cloneRecord);
    }
}
function isScopeMatch(recordScope, queryScope) {
    return (recordScope.tenantId === queryScope.tenantId &&
        optionalScopeMatches(recordScope.organizationId, queryScope.organizationId) &&
        optionalScopeMatches(recordScope.companyId, queryScope.companyId) &&
        optionalScopeMatches(recordScope.ruc, queryScope.ruc));
}
function optionalScopeMatches(recordValue, queryValue) {
    return queryValue === undefined || recordValue === queryValue;
}
function tokenize(text) {
    return text
        .toLowerCase()
        .split(/[^a-z0-9áéíóúñ]+/iu)
        .map((term) => term.trim())
        .filter((term) => term.length > 0);
}
function scoreRecord(record, terms) {
    const searchable = [
        record.content,
        record.agentId,
        record.type,
        ...(record.metadata.tags ?? []),
    ]
        .join(" ")
        .toLowerCase();
    return terms.reduce((score, term) => score + (searchable.includes(term) ? 1 : 0), 0);
}
function uniqueRecords(records) {
    const seen = new Set();
    const unique = [];
    for (const record of records) {
        if (seen.has(record.id))
            continue;
        seen.add(record.id);
        unique.push(record);
    }
    return unique;
}
function cloneRecord(record) {
    return {
        ...record,
        scope: { ...record.scope },
        metadata: { ...record.metadata },
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
    };
}
//# sourceMappingURL=in-memory-agent-memory-store.js.map