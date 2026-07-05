import { getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";
import type { StreamChunk } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function chatHeaders() {
	const companyContext = getCompanyContext();
	const organizationId = getOrganizationId();
	const headers: Record<string, string> = {
		...getGovernanceAuditHeaders(),
		"x-company-id": companyContext.companyId,
		"x-company-ruc": companyContext.ruc,
		"x-fiscal-period": getActiveFiscalPeriod(),
		"Content-Type": "application/json",
	};
	if (organizationId) {
		headers["x-organization-id"] = organizationId;
	}
	return { headers };
}

async function* parseSseStream(
	body: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamChunk> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			let eventType = "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith("event: ")) {
					eventType = trimmed.slice(7).trim();
				} else if (trimmed.startsWith("data: ")) {
					const raw = trimmed.slice(6).trim();
					if (!raw) continue;

					try {
						const data = JSON.parse(raw);
						switch (eventType) {
							case "token":
								yield { type: "token", content: data.token ?? "" };
								break;
							case "intent":
								yield {
									type: "tool",
									toolName: data.tool ?? "analyze",
									status: "running",
								};
								break;
							case "result":
								if (!data.ok) {
									yield {
										type: "error",
										error: data.error ?? "Request failed",
									};
								}
								break;
							case "error":
								yield { type: "error", error: data.error ?? "Unknown error" };
								break;
							case "done":
								yield { type: "done" };
								break;
						}
					} catch {
						if (raw === "[DONE]") {
							yield { type: "done" };
						}
					}
				}
			}
		}
	} finally {
		reader.releaseLock();
	}

	if (buffer.trim()) {
		yield { type: "token", content: buffer };
	}
}

async function* mockStreamResponse(
	message: string,
): AsyncGenerator<StreamChunk> {
	const isFiscalQuery =
		/ruc|sunat|igv|factura|declaraci.n|detracci.n|retenci.n|sire|fiscal/i.test(
			message,
		);

	if (isFiscalQuery) {
		yield { type: "token", content: "Analizando consulta fiscal" };
		await sleep(50);
		yield { type: "token", content: "..." };
		await sleep(200);

		yield {
			type: "tool",
			toolName: "consultar_sunat",
			status: "running",
		};
		await sleep(600);
		yield {
			type: "tool",
			toolName: "consultar_sunat",
			status: "completed",
			output:
				"RUC: 20608451231\nEstado: ACTIVO\nCondición: HABIDO\nÚltima declaración: 2026-04",
		};

		yield { type: "token", content: "\n\n" };
		await sleep(100);

		const fiscalTokens = [
			"La consulta a SUNAT muestra que el RUC se encuentra en estado ACTIVO y HABIDO.",
			"",
			"**Resumen del período**:",
			"- Total ingresos declarados: S/ 1,234,567.89",
			"- IGV mensual: S/ 222,222.22",
			"- Detracciones: S/ 45,678.90",
			"- Retenciones: S/ 12,345.67",
			"",
			"No se detectaron discrepancias críticas en las declaraciones.",
		];

		for (const token of fiscalTokens) {
			for (const char of token) {
				yield { type: "token", content: char };
				await sleep(5 + Math.random() * 15);
			}
			yield { type: "token", content: "\n" };
			await sleep(80);
		}
	} else {
		const tokens = [
			"He procesado tu solicitud.",
			"",
			"```json",
			JSON.stringify(
				{
					status: "processed",
					query: message.slice(0, 60),
					timestamp: new Date().toISOString(),
				},
				null,
				2,
			),
			"```",
			"",
			"¿Hay algo más en lo que pueda ayudarte?",
		];

		for (const token of tokens) {
			for (const char of token) {
				yield { type: "token", content: char };
				await sleep(8 + Math.random() * 18);
			}
			yield { type: "token", content: "\n" };
			await sleep(60);
		}
	}

	yield { type: "done" };
}

export { chatHeaders, mockStreamResponse, parseSseStream, sleep };
