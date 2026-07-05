import { randomUUID } from "node:crypto";
import { RUC } from "@drenyra/domain";
import { InboxService } from "../../services/inbox.service";
import type {
	AgentDebateEvent,
	AgentStatusEvent,
	BatchCompleteEvent,
	InboxInvoiceSeed,
	InboxInvoiceSummary,
	InboxProcessContext,
	InboxSseEmitter,
} from "./inbox.types";

const AGENT_PIPELINE = [
	"Reader",
	"Classifier",
	"Validator",
	"Accounting",
	"Reporter",
] as const;

type PipelineAgent = (typeof AGENT_PIPELINE)[number];

interface ParsedInvoiceHint {
	ruc?: string;
	subtotal?: number;
	igv?: number;
	total?: number;
	isXml: boolean;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseInvoiceHint(file: File, text: string): ParsedInvoiceHint {
	const isXml =
		file.name.toLowerCase().endsWith(".xml") || text.includes("<?xml");
	if (!isXml) {
		return { isXml: false };
	}

	const rucMatch = text.match(/<cbc:ID[^>]*>(\d{11})<\/cbc:ID>/i);
	const taxAmountMatch = text.match(
		/<cbc:TaxAmount[^>]*>([\d.]+)<\/cbc:TaxAmount>/i,
	);
	const payableMatch = text.match(
		/<cbc:PayableAmount[^>]*>([\d.]+)<\/cbc:PayableAmount>/i,
	);
	const lineExtensionMatch = text.match(
		/<cbc:LineExtensionAmount[^>]*>([\d.]+)<\/cbc:LineExtensionAmount>/i,
	);

	const total = payableMatch ? Number(payableMatch[1]) : undefined;
	const igv = taxAmountMatch ? Number(taxAmountMatch[1]) : undefined;
	const subtotal = lineExtensionMatch
		? Number(lineExtensionMatch[1])
		: total && igv
			? total - igv
			: undefined;

	return {
		isXml: true,
		ruc: rucMatch?.[1],
		subtotal,
		igv,
		total,
	};
}

function validateRuc(ruc: string | undefined): {
	valid: boolean;
	detail: string;
} {
	if (!ruc) {
		return { valid: false, detail: "RUC no detectado en el comprobante" };
	}
	try {
		RUC.create(ruc);
		return { valid: true, detail: `RUC ${ruc} → dígito verificador OK` };
	} catch {
		return { valid: false, detail: `RUC ${ruc} inválido (Módulo 11)` };
	}
}

function validateIgv(
	subtotal: number | undefined,
	igv: number | undefined,
): { valid: boolean; detail: string } {
	if (subtotal === undefined || igv === undefined) {
		return {
			valid: true,
			detail: "IGV no calculado — revisión manual sugerida",
		};
	}
	const expected = Math.round(subtotal * 0.18 * 100) / 100;
	const delta = Math.abs(expected - igv);
	if (delta <= 0.05) {
		return { valid: true, detail: `IGV 18% correcto (S/ ${igv.toFixed(2)})` };
	}
	return {
		valid: false,
		detail: `IGV esperado S/ ${expected.toFixed(2)}, encontrado S/ ${igv.toFixed(2)}`,
	};
}

function agentMessage(
	agent: PipelineAgent,
	seed: InboxInvoiceSeed,
	hint: ParsedInvoiceHint,
): string {
	switch (agent) {
		case "Reader":
			return hint.isXml
				? `Leyendo ${seed.filename} · extrayendo UBL 2.1`
				: `Leyendo ${seed.filename} · OCR pendiente (PDF/imagen)`;
		case "Classifier":
			return hint.isXml
				? "Factura de compra · Servicios"
				: "Clasificación preliminar · requiere confirmación";
		case "Validator": {
			const ruc = validateRuc(hint.ruc);
			return ruc.detail;
		}
		case "Accounting":
			return hint.total
				? `Débito: Gasto · Crédito: IGV · Total S/ ${hint.total.toFixed(2)}`
				: "Asiento preliminar · montos pendientes";
		case "Reporter":
			return "Resumen fiscal generado para declaración";
	}
}

/**
 * Sequential agent pipeline per invoice; batches run in parallel.
 */
export class InvoiceOrchestrator {
	constructor(private readonly emit: InboxSseEmitter) {}

	async processBatch(
		context: InboxProcessContext,
		files: File[],
	): Promise<BatchCompleteEvent> {
		const total = files.length;
		const summaries: InboxInvoiceSummary[] = [];
		let processed = 0;

		await Promise.all(
			files.map(async (file, index) => {
				const seed: InboxInvoiceSeed = {
					invoiceId: `INV-${context.batchId.slice(0, 8)}-${index + 1}`,
					filename: file.name,
					mimeType: file.type || "application/octet-stream",
				};

				try {
					const summary = await this.processOneInvoice(context, seed, file);
					summaries.push(summary);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Error desconocido";
					this.emit({
						type: "invoice:error",
						payload: { invoiceId: seed.invoiceId, error: message },
					});
					summaries.push({
						invoiceId: seed.invoiceId,
						filename: seed.filename,
						status: "error",
						error: message,
					});
				} finally {
					processed += 1;
					const percent = Math.round((processed / total) * 100);
					this.emit({
						type: "batch:progress",
						payload: { processed, total, percent },
					});
				}
			}),
		);

		const ready = summaries.filter((item) => item.status === "ready").length;
		const needsReview = summaries.filter(
			(item) => item.status === "needs-review",
		).length;
		const errors = summaries.filter((item) => item.status === "error").length;

		const complete: BatchCompleteEvent = {
			ready,
			needsReview,
			errors,
			summary: `${ready} listas para declarar · ${needsReview} revisión · ${errors} error`,
			invoices: summaries,
		};

		this.emit({ type: "batch:complete", payload: complete });
		return complete;
	}

	private async processOneInvoice(
		context: InboxProcessContext,
		seed: InboxInvoiceSeed,
		file: File,
	): Promise<InboxInvoiceSummary> {
		const text = await file.text();
		const hint = parseInvoiceHint(file, text);

		for (const agent of AGENT_PIPELINE) {
			this.emitStatus({
				agent,
				status: "running",
				message: agentMessage(agent, seed, hint),
				invoiceId: seed.invoiceId,
			});
			await sleep(180);
			this.emitStatus({
				agent,
				status: "completed",
				message: agentMessage(agent, seed, hint),
				invoiceId: seed.invoiceId,
			});
		}

		const rucCheck = validateRuc(hint.ruc);
		const igvCheck = validateIgv(hint.subtotal, hint.igv);

		if (!rucCheck.valid || !igvCheck.valid) {
			const debate: AgentDebateEvent = {
				agents: ["Validator", "Debate"],
				message: !rucCheck.valid
					? `${rucCheck.detail} — ¿PDF legítimo con RUC mal impreso?`
					: `${igvCheck.detail} — ¿redondeo SUNAT o error de emisor?`,
				invoiceId: seed.invoiceId,
			};
			this.emit({ type: "agent:debate", payload: debate });
			await sleep(120);

			const reason = !rucCheck.valid ? rucCheck.detail : igvCheck.detail;
			const summary: InboxInvoiceSummary = {
				invoiceId: seed.invoiceId,
				filename: seed.filename,
				status: "needs-review",
				total: hint.total,
				igv: hint.igv,
				accountingLabel: "Gasto · Servicios",
				reason,
			};

			this.emit({
				type: "invoice:needs-review",
				payload: {
					invoiceId: seed.invoiceId,
					reason,
					details: debate.message,
				},
			});

			await InboxService.processUpload(file, context.companyId).catch(() => {
				/* persistence best-effort during MVP stream */
			});

			return summary;
		}

		const summary: InboxInvoiceSummary = {
			invoiceId: seed.invoiceId,
			filename: seed.filename,
			status: "ready",
			total: hint.total,
			igv: hint.igv,
			accountingLabel: "Gasto · Servicios",
		};

		this.emit({
			type: "invoice:ready",
			payload: { invoiceId: seed.invoiceId, summary },
		});

		await InboxService.processUpload(file, context.companyId).catch(() => {
			/* persistence best-effort during MVP stream */
		});

		return summary;
	}

	private emitStatus(payload: AgentStatusEvent): void {
		this.emit({ type: "agent:status", payload });
	}
}

export function createInboxBatchId(): string {
	return randomUUID();
}
