export class ApprovalStore {
    requests = new Map();
    save(request) {
        this.requests.set(request.id, request);
    }
    get(id) {
        return this.requests.get(id);
    }
    update(id, partial) {
        const existing = this.requests.get(id);
        if (existing) {
            Object.assign(existing, partial);
        }
    }
    listByState(state) {
        return Array.from(this.requests.values()).filter((r) => r.state === state);
    }
    listByContext(context) {
        return Array.from(this.requests.values()).filter((r) => r.context.tenantId === context.tenantId);
    }
    getAll() {
        return Array.from(this.requests.values());
    }
}
//# sourceMappingURL=approval-store.js.map