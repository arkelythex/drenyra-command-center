export class InMemoryFiscalPhaseStore {
    states = new Map();
    key(ruc, periodo) {
        return `${ruc}:${periodo}`;
    }
    async getPeriodState(ruc, periodo) {
        return this.states.get(this.key(ruc, periodo));
    }
    async upsertPeriodState(state) {
        this.states.set(this.key(state.ruc, state.periodo), {
            ...state,
            updatedAt: new Date(),
        });
    }
    async updatePhaseStatus(ruc, periodo, phaseId, status) {
        const state = this.states.get(this.key(ruc, periodo));
        if (!state)
            return undefined;
        const updated = {
            ...state,
            currentPhase: phaseId,
            status,
            updatedAt: new Date(),
        };
        this.states.set(this.key(ruc, periodo), updated);
        return updated;
    }
    async addGateResult(ruc, periodo, phaseId, gateResult) {
        const state = this.states.get(this.key(ruc, periodo));
        if (!state)
            return;
        const updatedHistory = state.phaseHistory.map((entry) => {
            if (entry.phaseId === phaseId) {
                return {
                    ...entry,
                    gateResults: [...entry.gateResults, gateResult],
                };
            }
            return entry;
        });
        this.states.set(this.key(ruc, periodo), {
            ...state,
            phaseHistory: updatedHistory,
            updatedAt: new Date(),
        });
    }
    async addPhaseHistoryEntry(ruc, periodo, entry) {
        const state = this.states.get(this.key(ruc, periodo));
        if (!state)
            return;
        const existingIndex = state.phaseHistory.findIndex((e) => e.phaseId === entry.phaseId);
        let updatedHistory;
        if (existingIndex >= 0) {
            updatedHistory = [...state.phaseHistory];
            updatedHistory[existingIndex] = entry;
        }
        else {
            updatedHistory = [...state.phaseHistory, entry];
        }
        this.states.set(this.key(ruc, periodo), {
            ...state,
            phaseHistory: updatedHistory,
            updatedAt: new Date(),
        });
    }
    async listPeriodsByStatus(ruc, status) {
        const results = [];
        for (const [k, state] of this.states) {
            if (k.startsWith(`${ruc}:`) && state.status === status) {
                results.push({
                    periodo: state.periodo,
                    currentPhase: state.currentPhase,
                });
            }
        }
        return results;
    }
    async listActivePeriods() {
        const results = [];
        const terminal = ["completed", "failed"];
        for (const state of this.states.values()) {
            if (!terminal.includes(state.status)) {
                results.push({ ruc: state.ruc, periodo: state.periodo });
            }
        }
        return results;
    }
}
//# sourceMappingURL=fiscal-phase-store.js.map