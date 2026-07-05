/**
 * NubeFact OSE Provider Implementation
 * @principle Single Responsibility - Only handles NubeFact API
 */

import type {
	IOSEProvider,
	OSEConfig,
	OSEResponse,
	SendInvoiceData,
} from "../types";

export class NubeFactProvider implements IOSEProvider {
	constructor(private config: OSEConfig) {}

	async send(data: SendInvoiceData): Promise<OSEResponse> {
		const response = await fetch(`${this.config.apiUrl}/invoice/send`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.config.apiToken}`,
			},
			body: JSON.stringify({
				ruc: this.config.ruc,
				usuario_sol: this.config.username,
				tipo_comprobante: data.invoiceType,
				xml_base64: Buffer.from(data.xmlContent).toString("base64"),
			}),
		});

		if (!response.ok) {
			throw new Error(`NubeFact API error: ${response.status}`);
		}

		const result = await response.json();

		return {
			success: result.aceptada_por_sunat === true,
			cdrContent: result.cdr,
			cdrStatus: this.parseCdrStatus(result.sunat_description),
			cdrMessage: result.sunat_description,
			sunatCode: result.sunat_code,
			sunatDescription: result.sunat_description,
		};
	}

	async checkStatus(): Promise<{ online: boolean; message: string }> {
		try {
			const response = await fetch(`${this.config.apiUrl}/status`, {
				headers: { Authorization: `Bearer ${this.config.apiToken}` },
			});

			return {
				online: response.ok,
				message: response.ok ? "NubeFact online" : "NubeFact offline",
			};
		} catch {
			return { online: false, message: "NubeFact unreachable" };
		}
	}

	private parseCdrStatus(description?: string): OSEResponse["cdrStatus"] {
		if (!description) return "OBSERVADO";
		if (description.includes("ACEPTADO")) return "ACEPTADO";
		if (description.includes("RECHAZADO")) return "RECHAZADO";
		return "OBSERVADO";
	}
}
