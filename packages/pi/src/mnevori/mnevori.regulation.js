export class MnevoriRegulationTracker {
    regulations = new Map();
    currentVersion;
    constructor(currentVersion = "2026.1") {
        this.currentVersion = currentVersion;
    }
    register(regulation) {
        this.regulations.set(regulation.regulationId, regulation);
    }
    updateCurrentVersion(version) {
        this.currentVersion = version;
    }
    evaluateArtifactCache(artifact) {
        if (artifact.version === 0)
            return "needs_review";
        const phaseReg = this.regulations.get(`phase:${artifact.phaseId}`);
        if (phaseReg?.deprecatedAt) {
            return "invalid";
        }
        return "valid";
    }
    findStaleArtifacts(artifacts) {
        return artifacts.filter((a) => this.evaluateArtifactCache(a) !== "valid");
    }
}
//# sourceMappingURL=mnevori.regulation.js.map