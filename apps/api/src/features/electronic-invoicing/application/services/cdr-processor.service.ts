/**
 * CDR Processor Service — processes OSE/SUNAT responses and maps statuses.
 * Extracted from ElectronicInvoicingService.processOSEResponse() and related methods.
 */

import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../../lib/compliance-runbooks";
import type {
	CdrWebhookPayload,
	ElectronicInvoiceResult,
	RunbookReference,
} from "../../domain/cpe.types";
import { CpeRepository } from "../../infrastructure/cpe.repository";

export class CdrProcessorService {
	/**
	 * Processes OSE response and determines final status.
	 */
	static async processResponse(
		transactionId: string,
		oseResult: {
			success: boolean;
			cdrContent?: string;
			cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
			cdrMessage?: string;
			sunatCode?: string;
			sunatDescription?: string;
			error?: string;
		},
		appendLifecycleEvent: (
			transactionId: string,
			event: Record<string, unknown>,
		) => Promise<void>,
		updateTransactionStatus: (
			transactionId: string,
			status: string,
			metadata: Record<string, unknown>,
		) => Promise<void>,
	): Promise<ElectronicInvoiceResult> {
		let status: ElectronicInvoiceResult["status"];
		let sunatCode: string | undefined;
		let sunatMessage: string | undefined;
		let runbook: RunbookReference | undefined;

		if (oseResult.success) {
			switch (oseResult.cdrStatus) {
				case "ACEPTADO":
					status = "ACCEPTED";
					break;
				case "RECHAZADO":
					status = "REJECTED";
					break;
				case "OBSERVADO":
					status = "OBSERVED";
					break;
				default:
					status = "SUBMITTED";
			}

			sunatCode = oseResult.sunatCode;
			sunatMessage = oseResult.sunatDescription || oseResult.cdrMessage;

			await appendLifecycleEvent(transactionId, {
				stage: "OSE_RESPONSE",
				status,
				source: "SUNAT",
				message: sunatMessage ?? "Respuesta SUNAT recibida",
				metadata: { sunatCode, cdrStatus: oseResult.cdrStatus },
			});
		} else {
			status = "ANNULLED";
			sunatMessage = oseResult.error;
			runbook = CPE_COMPLIANCE_INCIDENT_RUNBOOK;

			await appendLifecycleEvent(transactionId, {
				stage: "OSE_RESPONSE",
				status: "ERROR",
				source: "SUNAT",
				message: sunatMessage ?? "OSE/SUNAT devolvió error",
				metadata: { runbookId: CPE_COMPLIANCE_INCIDENT_RUNBOOK.id },
			});
		}

		await updateTransactionStatus(transactionId, status, {
			...(oseResult.cdrContent !== undefined
				? { cdrContent: oseResult.cdrContent }
				: {}),
			...(sunatCode !== undefined ? { sunatCode } : {}),
			...(sunatMessage !== undefined ? { sunatMessage } : {}),
		});

		return {
			success: oseResult.success,
			transactionId,
			status,
			...(oseResult.cdrContent !== undefined
				? { cdrContent: oseResult.cdrContent }
				: {}),
			...(sunatCode !== undefined ? { sunatCode } : {}),
			...(sunatMessage !== undefined ? { sunatMessage } : {}),
			processingTime: 0,
			...(runbook !== undefined ? { runbook } : {}),
		};
	}

	/**
	 * Maps CDR webhook status to internal transaction status.
	 */
	static mapCdrStatus(
		status: CdrWebhookPayload["cdrStatus"],
	): ElectronicInvoiceResult["status"] {
		switch (status) {
			case "ACEPTADO":
				return "ACCEPTED";
			case "RECHAZADO":
				return "REJECTED";
			default:
				return "OBSERVED";
		}
	}

	/**
	 * Checks if a CDR webhook was already processed (idempotency).
	 */
	static async isAlreadyProcessed(
		transactionId: string,
		providerReference?: string,
	): Promise<boolean> {
		const transaction =
			await CpeRepository.findTransactionWithTags(transactionId);
		if (!transaction) return false;

		const tags = CdrProcessorService.getTagsObject(transaction.tags);
		const trail = CdrProcessorService.getTrail(tags);
		const cdrEvents = trail.filter((event) => event.stage === "CDR_WEBHOOK");

		if (cdrEvents.length === 0) return false;

		if (providerReference) {
			return cdrEvents.some((event) => {
				const metadata = CdrProcessorService.getNestedObject(event.metadata);
				return metadata.providerReference === providerReference;
			});
		}

		return cdrEvents.length > 0;
	}

	private static getTagsObject(value: unknown): Record<string, unknown> {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			return { ...(value as Record<string, unknown>) };
		}
		return {};
	}

	private static getNestedObject(value: unknown): Record<string, unknown> {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return {};
	}

	private static getTrail(
		tags: Record<string, unknown>,
	): Array<{ stage: string; metadata?: Record<string, unknown> }> {
		const trail = tags.electronicInvoicingTrail;
		if (!Array.isArray(trail)) return [];
		return trail.filter(
			(item): item is { stage: string; metadata?: Record<string, unknown> } => {
				if (!item || typeof item !== "object") return false;
				const record = item as Record<string, unknown>;
				return typeof record.stage === "string";
			},
		);
	}
}
