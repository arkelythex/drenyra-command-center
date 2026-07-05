import type { OSEConfig } from "@drenyra/infrastructure/ose";
import type {
	IOSEProvider,
	OSEResponse,
	SendInvoiceData,
} from "../provider.interface";

/**
 * Internal simulation provider for end-to-end testing without real OSE credentials.
 *
 * Deterministic behavior:
 * - invoiceNumber contains "RECH" or ends with "-99" => RECHAZADO
 * - invoiceNumber contains "OBS" => OBSERVADO
 * - otherwise => ACEPTADO
 */
export class SimulationOSEProvider implements IOSEProvider {
	constructor(private readonly config: OSEConfig) {}

	async send(data: SendInvoiceData): Promise<OSEResponse> {
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

	async checkStatus(): Promise<{ online: boolean; message: string }> {
		const envLabel = this.config.environment === "production" ? "production" : "sandbox";
		return {
			online: true,
			message: `Simulation provider online (${envLabel})`,
		};
	}

	private getOutcome(invoiceNumber: string): {
		status: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
		code: string;
		message: string;
	} {
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

	private buildCdrXml(code: string, description: string): string {
		return `<?xml version="1.0" encoding="UTF-8"?><ApplicationResponse><cbc:ResponseCode>${code}</cbc:ResponseCode><cbc:Description>${description}</cbc:Description></ApplicationResponse>`;
	}
}
