export class InMemoryEvidenceStore {
    records = [];
    maxRecords;
    constructor(options) {
        this.maxRecords = options?.maxRecords ?? Infinity;
    }
    async save(record) {
        this.records.push({ ...record, content: structuredClone(record.content) });
        while (this.records.length > this.maxRecords) {
            this.records.shift();
        }
    }
    async query(query) {
        const limit = query.limit ?? 50;
        let results = [...this.records];
        if (query.runId !== undefined) {
            results = results.filter((r) => r.runId === query.runId);
        }
        if (query.type !== undefined) {
            results = results.filter((r) => r.type === query.type);
        }
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return results.slice(0, limit);
    }
    async getById(id) {
        const record = this.records.find((r) => r.id === id);
        return record ? { ...record, content: structuredClone(record.content) } : null;
    }
    async deleteByRun(runId) {
        let i = 0;
        while (i < this.records.length) {
            if (this.records[i].runId === runId) {
                this.records.splice(i, 1);
            }
            else {
                i++;
            }
        }
    }
    get count() {
        return this.records.length;
    }
}
//# sourceMappingURL=evidence.js.map