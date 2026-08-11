/**
 * CPE Lifecycle Service — manages lifecycle events, snapshots, and traceability.
 * Extracted from ElectronicInvoicingService lifecycle methods.
 */

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { transactions } from "@drenyra/persistence/schema";
import { resolveCpeRunbook } from "../../../../lib/compliance-runbooks";
import type {
	CpeLifecycleSnapshot,
	ElectronicInvoiceResult,
	ElectronicInvoicingTrailEvent,
} from "../../domain/cpe.types";
import { CpeRepository } from "../../infrastructure/cpe.repository";

export class CpeLifecycleService {
	/**
	 * Assesses lifecycle traceability for compliance auditing.
	 */
	static assessTraceability(input: {
		invoiceId?: string;
		currentStatus: string;
		sunatStatus: string | null;
		timeline: CpeLifecycleSnapshot["timeline"];
		cdrContent?: string | null;
	}): CpeLifecycleSnapshot["evidence"] & CpeLifecycleSnapshot["traceability"] {
		const hasStage = (stage: string): boolean =>
			input.timeline.some((event) => event.stage === stage);
		const hasAnyStage = (stages: string[]): boolean =>
			stages.some((stage) => hasStage(stage));

		const latestCdrEvent = [...input.timeline]
			.reverse()
			.find((event) => event.stage === "CDR_WEBHOOK");
		const latestProviderReference = latestCdrEvent
			? CpeLifecycleService.readString(
					latestCdrEvent.metadata?.providerReference,
				)
			: null;

		const nonDraftEvents = input.timeline.filter(
			(event) => event.stage !== "CREATED",
		);
		const normalizedStatus = input.currentStatus.trim().toUpperCase();
		const finalStateReached = [
			"ACCEPTED",
			"REJECTED",
			"OBSERVED",
			"ANNULLED",
		].includes(normalizedStatus);

		const evidence = {
			invoiceLinked:
				typeof input.invoiceId === "string" &&
				input.invoiceId.trim().length > 0,
			oseSubmissionRecorded: hasStage("OSE_SUBMISSION"),
			sunatResponseCaptured:
				typeof input.sunatStatus === "string" &&
				input.sunatStatus.trim().length > 0
					? true
					: hasAnyStage(["OSE_RESPONSE", "CDR_WEBHOOK"]),
			cdrEvidenceStored:
				typeof input.cdrContent === "string" &&
				input.cdrContent.trim().length > 0,
			statusTransitionRecorded:
				nonDraftEvents.length > 0 &&
				hasAnyStage(["STATUS_UPDATE", "SYSTEM_STATUS"]),
			latestProviderReference,
			lastEventAt:
				nonDraftEvents.length > 0
					? new Date(nonDraftEvents[nonDraftEvents.length - 1]?.at ?? "")
					: null,
		};

		const missing: string[] = [];
		if (!evidence.invoiceLinked) missing.push("INVOICE_LINK");
		if (!evidence.oseSubmissionRecorded && normalizedStatus !== "DRAFT")
			missing.push("OSE_SUBMISSION");
		if (!evidence.statusTransitionRecorded && normalizedStatus !== "DRAFT")
			missing.push("STATUS_TRANSITION");
		if (!finalStateReached) missing.push("FINAL_STATUS");
		if (
			["ACCEPTED", "REJECTED", "OBSERVED", "SUBMITTED"].includes(
				normalizedStatus,
			) &&
			!evidence.sunatResponseCaptured
		) {
			missing.push("SUNAT_RESPONSE");
		}
		if (
			["ACCEPTED", "REJECTED", "OBSERVED"].includes(normalizedStatus) &&
			!evidence.cdrEvidenceStored
		) {
			missing.push("CDR_EVIDENCE");
		}
		if (
			normalizedStatus === "ANNULLED" &&
			!hasAnyStage(["PROCESS_ERROR", "OSE_RESPONSE"])
		) {
			missing.push("ANNULLED_REASON");
		}

		return {
			...evidence,
			traceable: missing.length === 0,
			finalStateReached,
			missing,
		};
	}

	/**
	 * Appends a lifecycle event to the transaction trail.
	 */
	static async appendEvent(
		transactionId: string,
		event: Omit<ElectronicInvoicingTrailEvent, "at"> & { at?: string },
	): Promise<void> {
		const transaction =
			await CpeRepository.findTransactionWithTags(transactionId);
		if (!transaction) return;

		const tags = CpeLifecycleService.getTagsObject(transaction.tags);
		const trail = CpeLifecycleService.getTrail(tags);
		trail.push({ ...event, at: event.at ?? new Date().toISOString() });
		tags.electronicInvoicingTrail = trail;

		await CpeRepository.updateTransactionTags(transactionId, tags);
	}

	/**
	 * Updates transaction status and syncs with invoice.
	 */
	static async updateStatus(
		transactionId: string,
		status: ElectronicInvoiceResult["status"],
		metadata: {
			cdrContent?: string;
			sunatCode?: string;
			sunatMessage?: string;
		},
	): Promise<void> {
		const current = await CpeRepository.findTransactionWithTags(transactionId);
		if (!current) return;

		const tags = CpeLifecycleService.getTagsObject(current.tags);
		const trail = CpeLifecycleService.getTrail(tags);
		trail.push({
			stage: "STATUS_UPDATE",
			status,
			source: "SYSTEM",
			message: metadata.sunatMessage ?? `Estado actualizado a ${status}`,
			at: new Date().toISOString(),
			metadata: { sunatCode: metadata.sunatCode },
		});

		tags.electronicInvoicing = {
			...CpeLifecycleService.getNestedObject(tags.electronicInvoicing),
			sunatCode: metadata.sunatCode ?? null,
			sunatMessage: metadata.sunatMessage ?? null,
			sunatStatus: status,
			cdrContent: metadata.cdrContent ?? null,
		};
		tags.electronicInvoicingTrail = trail;

		await CpeRepository.updateTransactionStatus(transactionId, status, tags);
		await CpeLifecycleService.syncInvoiceStatus(
			transactionId,
			status,
			metadata,
		);
	}

	/**
	 * Gets complete lifecycle snapshot for a transaction.
	 */
	static async getSnapshot(
		transactionId: string,
		companyId: string,
	): Promise<CpeLifecycleSnapshot | null> {
		const transaction = await db.query.transactions.findFirst({
			where: and(
				eq(transactions.id, transactionId),
				eq(transactions.companyId, companyId),
			),
			columns: {
				id: true,
				series: true,
				number: true,
				status: true,
				tags: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		if (!transaction) return null;

		const tags = CpeLifecycleService.getTagsObject(transaction.tags);
		const electronic = CpeLifecycleService.getNestedObject(
			tags.electronicInvoicing,
		);
		const trail = CpeLifecycleService.getTrail(tags);

		const resolvedInvoice = await CpeLifecycleService.resolveInvoice({
			companyId,
			series: transaction.series,
			number: transaction.number,
		});

		const timeline: CpeLifecycleSnapshot["timeline"] = [
			{
				stage: "CREATED",
				status: "DRAFT",
				at: transaction.createdAt,
				source: "SYSTEM",
				message: "Transacción creada en estado borrador",
			},
		];
		for (const event of trail) {
			timeline.push({
				stage: event.stage,
				status: event.status,
				at: new Date(event.at),
				source: event.source,
				message: event.message,
				...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
			});
		}
		if (transaction.status && transaction.status !== "DRAFT") {
			timeline.push({
				stage: "SYSTEM_STATUS",
				status: transaction.status,
				at: transaction.updatedAt,
				source: "SYSTEM",
				message: `Estado actual ${transaction.status}`,
			});
		}

		const currentStatus = transaction.status ?? "UNKNOWN";
		const runbook = resolveCpeRunbook({
			currentStatus,
			timeline: timeline.map((event) => ({
				stage: event.stage,
				status: event.status,
			})),
		});
		const cdrContent = CpeLifecycleService.readString(electronic.cdrContent);
		const traceability = CpeLifecycleService.assessTraceability({
			...(resolvedInvoice?.id !== undefined
				? { invoiceId: resolvedInvoice.id }
				: {}),
			currentStatus,
			sunatStatus: CpeLifecycleService.readString(electronic.sunatStatus),
			timeline,
			cdrContent,
		});

		return {
			...(resolvedInvoice?.id !== undefined
				? { invoiceId: resolvedInvoice.id }
				: {}),
			transactionId: transaction.id,
			invoiceNumber: `${transaction.series ?? "N/A"}-${transaction.number ?? "N/A"}`,
			currentStatus,
			sunatStatus: CpeLifecycleService.readString(electronic.sunatStatus),
			sunatCode: CpeLifecycleService.readString(electronic.sunatCode),
			sunatMessage: CpeLifecycleService.readString(electronic.sunatMessage),
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
			...(runbook !== undefined ? { runbook } : {}),
			evidence: {
				invoiceLinked: traceability.invoiceLinked,
				oseSubmissionRecorded: traceability.oseSubmissionRecorded,
				sunatResponseCaptured: traceability.sunatResponseCaptured,
				cdrEvidenceStored: traceability.cdrEvidenceStored,
				statusTransitionRecorded: traceability.statusTransitionRecorded,
				latestProviderReference: traceability.latestProviderReference,
				lastEventAt: traceability.lastEventAt,
			},
			traceability: {
				traceable: traceability.traceable,
				finalStateReached: traceability.finalStateReached,
				missing: traceability.missing,
			},
			timeline,
		};
	}

	/**
	 * Gets lifecycle snapshot by invoice ID.
	 */
	static async getByInvoiceId(
		invoiceId: string,
		companyId: string,
	): Promise<CpeLifecycleSnapshot | null> {
		const invoice = await CpeRepository.findInvoiceByIdAndCompany(
			invoiceId,
			companyId,
		);
		if (!invoice) return null;

		const matched =
			await CpeLifecycleService.findTransactionForInvoice(invoice);
		if (!matched) return null;

		const snapshot = await CpeLifecycleService.getSnapshot(
			matched.id,
			companyId,
		);
		if (!snapshot) return null;

		return { ...snapshot, invoiceId: invoice.id };
	}

	// --- Private helpers ---

	private static getTagsObject(value: unknown): Record<string, unknown> {
		if (value && typeof value === "object" && !Array.isArray(value))
			return { ...(value as Record<string, unknown>) };
		return {};
	}

	private static getNestedObject(value: unknown): Record<string, unknown> {
		if (value && typeof value === "object" && !Array.isArray(value))
			return value as Record<string, unknown>;
		return {};
	}

	private static getTrail(
		tags: Record<string, unknown>,
	): ElectronicInvoicingTrailEvent[] {
		const trail = tags.electronicInvoicingTrail;
		if (!Array.isArray(trail)) return [];
		return trail.filter((item): item is ElectronicInvoicingTrailEvent => {
			if (!item || typeof item !== "object") return false;
			const record = item as Record<string, unknown>;
			return (
				typeof record.stage === "string" &&
				typeof record.status === "string" &&
				typeof record.source === "string" &&
				typeof record.message === "string" &&
				typeof record.at === "string"
			);
		});
	}

	private static readString(value: unknown): string | null {
		return typeof value === "string" ? value : null;
	}

	private static async resolveInvoice(input: {
		companyId: string;
		series: string | null;
		number: string | null;
	}) {
		if (!input.series) return null;
		const candidates = await CpeRepository.findInvoicesByCompanyAndSeries(
			input.companyId,
			input.series,
		);
		const normalizedCorrelative = CpeLifecycleService.parseInteger(
			input.number,
		);
		if (normalizedCorrelative === null) return null;
		const matched = candidates.find(
			(c) => c.correlative === normalizedCorrelative,
		);
		return matched ? { id: matched.id } : null;
	}

	private static async findTransactionForInvoice(input: {
		companyId: string;
		series: string;
		correlative: number;
	}) {
		const candidates = await CpeRepository.findTransactionsByCompanyAndSeries(
			input.companyId,
			input.series,
		);
		const matched = candidates.find(
			(c) => CpeLifecycleService.parseInteger(c.number) === input.correlative,
		);
		return matched ? { id: matched.id } : null;
	}

	private static parseInteger(value: string | null): number | null {
		if (!value) return null;
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) ? parsed : null;
	}

	private static mapStatusToInvoice(
		status: ElectronicInvoiceResult["status"],
	): "SENT" | "CANCELLED" | null {
		if (["SUBMITTED", "ACCEPTED", "OBSERVED", "REJECTED"].includes(status))
			return "SENT";
		if (status === "ANNULLED") return "CANCELLED";
		return null;
	}

	private static async syncInvoiceStatus(
		transactionId: string,
		status: ElectronicInvoiceResult["status"],
		metadata: {
			cdrContent?: string;
			sunatCode?: string;
			sunatMessage?: string;
		},
	): Promise<void> {
		const transaction =
			await CpeRepository.findTransactionForStatusSync(transactionId);
		if (!transaction?.companyId || !transaction.series) return;

		const invoice = await CpeLifecycleService.resolveInvoice({
			companyId: transaction.companyId,
			series: transaction.series,
			number: transaction.number,
		});
		if (!invoice) return;

		const invoiceStatus = CpeLifecycleService.mapStatusToInvoice(status);
		const nextState: Record<string, unknown> = {
			sunatStatus: status,
			updatedAt: new Date(),
		};
		if (invoiceStatus) nextState.status = invoiceStatus;
		if (metadata.cdrContent) nextState.cdrUrl = metadata.cdrContent;

		await CpeRepository.updateInvoiceStatus(invoice.id, nextState);
	}
}
