export class ShadowRunner {
    legacy;
    pi;
    constructor(legacy, pi) {
        this.legacy = legacy;
        this.pi = pi;
    }
    async createSession(request) {
        const sessionId = `shadow-${crypto.randomUUID()}`;
        const legacyStart = performance.now();
        let legacySuccess = false;
        let legacyError;
        try {
            await this.legacy.createSession({ ...request });
            legacySuccess = true;
        }
        catch (e) {
            legacyError = e instanceof Error ? e.message : String(e);
        }
        const legacyDuration = performance.now() - legacyStart;
        const piStart = performance.now();
        let piSuccess = false;
        let piError;
        try {
            await this.pi.createSession({ ...request });
            piSuccess = true;
        }
        catch (e) {
            piError = e instanceof Error ? e.message : String(e);
        }
        const piDuration = performance.now() - piStart;
        return {
            sessionId,
            legacy: {
                success: legacySuccess,
                durationMs: legacyDuration,
                error: legacyError,
            },
            pi: { success: piSuccess, durationMs: piDuration, error: piError },
            match: legacySuccess === piSuccess && legacyError === piError,
        };
    }
    async comparePrompt(sessionId, input) {
        const legacyStart = performance.now();
        let legacyError;
        try {
            await this.legacy.prompt(sessionId, input);
        }
        catch (e) {
            legacyError = e instanceof Error ? e.message : String(e);
        }
        const legacyDuration = performance.now() - legacyStart;
        const piStart = performance.now();
        let piError;
        try {
            await this.pi.prompt(sessionId, input);
        }
        catch (e) {
            piError = e instanceof Error ? e.message : String(e);
        }
        const piDuration = performance.now() - piStart;
        return {
            legacy: { durationMs: legacyDuration, error: legacyError },
            pi: { durationMs: piDuration, error: piError },
            match: legacyError === piError,
        };
    }
    async compareAbort(sessionId) {
        let legacyError;
        let piError;
        try {
            await this.legacy.abort(sessionId);
        }
        catch (e) {
            legacyError = e instanceof Error ? e.message : String(e);
        }
        try {
            await this.pi.abort(sessionId);
        }
        catch (e) {
            piError = e instanceof Error ? e.message : String(e);
        }
        return { match: legacyError === piError };
    }
}
//# sourceMappingURL=shadow-runner.js.map