export class SimulationOSEProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async send(data) {
        const outcome = this.getOutcome(data.invoiceNumber);
        const cdrXml = this.buildCdrXml(outcome.code, outcome.message);
        return {
            success: outcome.status !== "RECHAZADO",
            cdrContent: Buffer.from(cdrXml, "utf8").toString("base64"),
            cdrStatus: outcome.status,
            cdrMessage: outcome.message,
            sunatCode: outcome.code,
            sunatDescription: `${outcome.status}: ${outcome.message}`,
        };
    }
    async checkStatus() {
        const envLabel = this.config.environment === "production" ? "production" : "sandbox";
        return {
            online: true,
            message: `Simulation provider online (${envLabel})`,
        };
    }
    getOutcome(invoiceNumber) {
        const normalized = invoiceNumber.toUpperCase();
        if (normalized.includes("RECH") || normalized.endsWith("-99")) {
            return {
                status: "RECHAZADO",
                code: "2001",
                message: "Documento rechazado en modo simulación",
            };
        }
        if (normalized.includes("OBS")) {
            return {
                status: "OBSERVADO",
                code: "0101",
                message: "Documento observado en modo simulación",
            };
        }
        return {
            status: "ACEPTADO",
            code: "0",
            message: "Documento aceptado en modo simulación",
        };
    }
    buildCdrXml(code, description) {
        return `<?xml version="1.0" encoding="UTF-8"?><ApplicationResponse><cbc:ResponseCode>${code}</cbc:ResponseCode><cbc:Description>${description}</cbc:Description></ApplicationResponse>`;
    }
}
//# sourceMappingURL=simulation.provider.js.map