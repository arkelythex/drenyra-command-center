const CURRENT_REGULATION_VERSION = "2026.1";
export class Mnevori {
    store;
    constructor(store) {
        this.store = store;
    }
    async persistArtifact(artifact) {
        const id = `mnevori:${artifact.ruc}:${artifact.periodo}:${artifact.phaseId}:${Date.now()}`;
        const full = {
            ...artifact,
            id,
            persistedAt: new Date().toISOString(),
        };
        const state = await this.store.getPeriodState(artifact.ruc, artifact.periodo);
        if (!state)
            throw new Error(`Period ${artifact.periodo} for RUC ${artifact.ruc} not found`);
        const mnevoriArtifacts = (state.metadata?._mnevori ?? {});
        const phaseArtifacts = (mnevoriArtifacts[artifact.phaseId] ??
            []);
        phaseArtifacts.push(full);
        mnevoriArtifacts[artifact.phaseId] = phaseArtifacts;
        await this.store.upsertPeriodState({
            ...state,
            metadata: {
                ...state.metadata,
                _mnevori: mnevoriArtifacts,
            },
        });
        return id;
    }
    async persistPhaseSnapshot(ruc, periodo, phaseId, snapshot) {
        return this.persistArtifact({
            ruc,
            periodo,
            phaseId,
            type: "phase_snapshot",
            payload: {
                status: snapshot.status,
                agentOutput: snapshot.agentOutput,
                gateResults: snapshot.gateResults,
            },
            version: 1,
            tier: "T2_STRONG",
        });
    }
    async getResumePoint(ruc, periodo) {
        const state = await this.store.getPeriodState(ruc, periodo);
        if (!state)
            return null;
        const phases = state.phaseHistory;
        if (phases.length === 0)
            return null;
        const last = phases[phases.length - 1];
        return {
            ruc,
            periodo,
            lastPhaseId: last.phaseId,
            lastStatus: last.status,
            regulationVersion: this.getRegulationVersion(),
            lastPersistedAt: last.completedAt?.toISOString() ?? last.startedAt.toISOString(),
        };
    }
    async listPhaseSnapshots(ruc, periodo) {
        const state = await this.store.getPeriodState(ruc, periodo);
        if (!state)
            return [];
        const mnevoriArtifacts = (state.metadata?._mnevori ?? {});
        const all = [];
        for (const phaseId of Object.keys(mnevoriArtifacts)) {
            const artifacts = mnevoriArtifacts[phaseId];
            all.push(...artifacts);
        }
        return all.sort((a, b) => new Date(b.persistedAt).getTime() - new Date(a.persistedAt).getTime());
    }
    getRegulationVersion() {
        return CURRENT_REGULATION_VERSION;
    }
    isRegulationCurrent(phaseVersion) {
        return phaseVersion === CURRENT_REGULATION_VERSION;
    }
}
//# sourceMappingURL=mnevori.js.map