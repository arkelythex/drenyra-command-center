const PHASE_SEQUENCE = [
    "captura",
    "clasificacion",
    "conciliacion",
    "cierre",
    "declaracion",
    "auditoria",
];
export class MnevoriResumeService {
    mnevori;
    store;
    constructor(mnevori, store) {
        this.mnevori = mnevori;
        this.store = store;
    }
    async findInterruptedPeriods() {
        const active = await this.store.listActivePeriods();
        const points = [];
        for (const { ruc, periodo } of active) {
            const point = await this.mnevori.getResumePoint(ruc, periodo);
            if (point)
                points.push(point);
        }
        return points;
    }
    getPhaseToResume(point) {
        if (point.lastStatus === "completed") {
            const idx = PHASE_SEQUENCE.indexOf(point.lastPhaseId);
            if (idx === -1 || idx >= PHASE_SEQUENCE.length - 1)
                return null;
            return PHASE_SEQUENCE[idx + 1];
        }
        if (point.lastStatus === "blocked" || point.lastStatus === "in_progress") {
            return point.lastPhaseId;
        }
        return null;
    }
}
//# sourceMappingURL=mnevori.resume.js.map