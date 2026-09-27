import { createHmac, timingSafeEqual } from "node:crypto";
import { oseConfigValidator } from "./config-validator";
import { OSEProviderFactory } from "./providers/factory";
export class OSEService {
    static config = {
        provider: OSEService.parseProvider(process.env.OSE_PROVIDER),
        apiUrl: process.env.OSE_API_URL || "https://api.nubefact.com/api/v1",
        apiToken: process.env.OSE_API_TOKEN || "",
        ruc: process.env.COMPANY_RUC || "",
        username: process.env.OSE_USERNAME || "",
        environment: process.env.OSE_ENV?.toLowerCase() === "production"
            ? "production"
            : "sandbox",
        simulationMode: OSEService.parseBoolean(process.env.OSE_SIMULATION_MODE),
        webhookSecret: process.env.OSE_WEBHOOK_SECRET || "",
    };
    static MAX_RETRIES = 3;
    static RETRY_DELAY = 2000;
    static async sendInvoice(data) {
        const effectiveConfig = OSEService.getEffectiveConfig();
        const validation = oseConfigValidator.validate(effectiveConfig);
        if (!validation.valid) {
            return OSEService.createConfigErrorResponse(validation);
        }
        const provider = OSEProviderFactory.create(effectiveConfig);
        return OSEService.executeWithRetry(() => provider.send(data));
    }
    static async checkStatus() {
        try {
            const effectiveConfig = OSEService.getEffectiveConfig();
            const provider = OSEProviderFactory.create(effectiveConfig);
            const status = await provider.checkStatus();
            return {
                online: status.online,
                provider: effectiveConfig.provider,
                message: status.message,
            };
        }
        catch (error) {
            return {
                online: false,
                provider: OSEService.getEffectiveConfig().provider,
                message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
            };
        }
    }
    static verifyWebhookSignature(rawPayload, signatureHeader) {
        const secret = (OSEService.config.webhookSecret ?? "").trim();
        if (!secret)
            return true;
        if (!signatureHeader)
            return false;
        const provided = signatureHeader.startsWith("sha256=")
            ? signatureHeader.slice("sha256=".length)
            : signatureHeader;
        const expected = createHmac("sha256", secret)
            .update(rawPayload)
            .digest("hex");
        try {
            const providedBuffer = Buffer.from(provided, "hex");
            const expectedBuffer = Buffer.from(expected, "hex");
            if (providedBuffer.length !== expectedBuffer.length)
                return false;
            return timingSafeEqual(providedBuffer, expectedBuffer);
        }
        catch {
            return false;
        }
    }
    static parseCDR(cdrBase64) {
        try {
            const cdrContent = Buffer.from(cdrBase64, "base64").toString("utf8");
            const statusMatch = cdrContent.match(/<cbc:ResponseCode>(\d+)<\/cbc:ResponseCode>/);
            const messageMatch = cdrContent.match(/<cbc:Description>(.+?)<\/cbc:Description>/);
            return {
                status: statusMatch?.[1] ?? "UNKNOWN",
                message: messageMatch?.[1] ?? "No message",
                code: statusMatch?.[1] ?? "0",
            };
        }
        catch {
            return { status: "ERROR", message: "Failed to parse CDR", code: "0" };
        }
    }
    static updateConfig(newConfig) {
        OSEService.config = { ...OSEService.config, ...newConfig };
    }
    static getConfig() {
        return { ...OSEService.config };
    }
    static getEffectiveConfig() {
        if (OSEService.config.simulationMode === true) {
            return {
                ...OSEService.config,
                provider: "simulation",
            };
        }
        return OSEService.config;
    }
    static parseBoolean(value) {
        if (!value)
            return false;
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "yes";
    }
    static parseProvider(value) {
        switch ((value ?? "nubefact").trim().toLowerCase()) {
            case "nubefact":
                return "nubefact";
            case "bizlinks":
                return "bizlinks";
            case "custom":
                return "custom";
            case "simulation":
                return "simulation";
            default:
                return "nubefact";
        }
    }
    static createConfigErrorResponse(validation) {
        return {
            success: false,
            error: `OSE not configured. Missing: ${validation.missing.join(", ")}`,
            attemptsCount: 0,
            attemptTrace: [
                {
                    attempt: 0,
                    status: "ERROR",
                    message: `Configuration missing: ${validation.missing.join(", ")}`,
                    at: new Date().toISOString(),
                },
            ],
        };
    }
    static async executeWithRetry(operation) {
        const attemptTrace = [];
        let lastError = null;
        for (let attempt = 1; attempt <= OSEService.MAX_RETRIES; attempt++) {
            try {
                const result = await operation();
                attemptTrace.push({
                    attempt,
                    status: result.success ? "SUCCESS" : "ERROR",
                    message: result.sunatDescription || result.error || "Operation completed",
                    at: new Date().toISOString(),
                });
                return { ...result, attemptsCount: attempt, attemptTrace };
            }
            catch (error) {
                lastError = error;
                attemptTrace.push({
                    attempt,
                    status: "ERROR",
                    message: lastError.message,
                    at: new Date().toISOString(),
                });
                if (attempt < OSEService.MAX_RETRIES) {
                    await OSEService.delay(OSEService.RETRY_DELAY * attempt);
                }
            }
        }
        return {
            success: false,
            error: `Failed after ${OSEService.MAX_RETRIES} attempts: ${lastError?.message}`,
            attemptsCount: OSEService.MAX_RETRIES,
            attemptTrace,
        };
    }
    static delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=ose.service.js.map