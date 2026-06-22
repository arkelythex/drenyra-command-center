/**
 * Electronic Invoicing Service — Facade.
 * Orquesta el flujo completo de facturación electrónica SUNAT 2026.
 *
 * Delega a los servicios extraídos en el feature:
 * - XmlParserService — parseo de XML UBL 2.1
 * - DataConsistencyService — verificación de coherencia
 * - CdrProcessorService — procesamiento de respuestas CDR
 * - CpeLifecycleService — gestión de ciclo de vida y traceabilidad
 *
 * Split from 1,270 lines → thin facade + 4 extracted services.
 */

import { invoices } from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { eq } from "@arkelythex/persistence/query";
import { CdrProcessorService } from "../features/electronic-invoicing/application/services/cdr-processor.service";
import { CpeLifecycleService } from "../features/electronic-invoicing/application/services/cpe-lifecycle.service";
import { ElectronicInvoiceProcessorService } from "../features/electronic-invoicing/application/services/electronic-invoice-processor.service";
import type {
	CdrWebhookPayload,
	CdrWebhookResult,
	CpeLifecycleSnapshot,
	ElectronicInvoiceData,
	ElectronicInvoiceResult,
} from "../features/electronic-invoicing/domain/cpe.types";
import { CpeRepository } from "../features/electronic-invoicing/infrastructure/cpe.repository";
import type { RunbookReference } from "../lib/compliance-runbooks";
import { createLogger } from "../lib/logger";

const logger = createLogger({ module: "services/electronic-invoicing" });

export type {
	CdrWebhookPayload,
	CdrWebhookResult,
	CpeLifecycleSnapshot,
	ElectronicInvoiceData,
	ElectronicInvoiceResult,
	RunbookReference,
};

export class ElectronicInvoicingService {
	static assessLifecycleTraceability =
		CpeLifecycleService.assessTraceability.bind(CpeLifecycleService);
	static getTransactionLifecycle =
		CpeLifecycleService.getSnapshot.bind(CpeLifecycleService);
	static getLifecycleByInvoiceId =
		CpeLifecycleService.getByInvoiceId.bind(CpeLifecycleService);
	static async resolveTransactionIdForInvoice(
		invoiceId: string,
	): Promise<string | null> {
		const invoice = await db.query.invoices.findFirst({
			where: eq(invoices.id, invoiceId),
			columns: { companyId: true, series: true, correlative: true },
		});
		if (!invoice) return null;
		const matched =
			await ElectronicInvoicingService.findTransactionForInvoiceMatch(invoice);
		return matched?.id ?? null;
	}

	static async processElectronicInvoice(
		data: ElectronicInvoiceData,
	): Promise<ElectronicInvoiceResult> {
		return ElectronicInvoiceProcessorService.processElectronicInvoice(data);
	}

	static async processCdrWebhook(
		payload: CdrWebhookPayload,
		companyId?: string,
	): Promise<CdrWebhookResult> {
		const transaction =
			await ElectronicInvoicingService.resolveTransactionForWebhook(
				payload,
				companyId,
			);
		if (!transaction)
			return {
				success: false,
				invoiceNumber: payload.invoiceNumber,
				message: "No se encontró transacción para el CDR recibido",
			};

		const alreadyProcessed = await CdrProcessorService.isAlreadyProcessed(
			transaction.id,
			payload.providerReference,
		);
		if (alreadyProcessed) {
			logger.info(
				{ invoiceNumber: payload.invoiceNumber, transactionId: transaction.id },
				"CDR webhook already processed; skipping duplicate payload",
			);
			return {
				success: true,
				transactionId: transaction.id,
				invoiceNumber: payload.invoiceNumber,
				status: ElectronicInvoicingService.mapCdrStatus(payload.cdrStatus),
				message: "CDR ya procesado anteriormente (idempotencia)",
			};
		}

		const status = ElectronicInvoicingService.mapCdrStatus(payload.cdrStatus);
		const sunatMessage = payload.sunatDescription ?? `CDR ${payload.cdrStatus}`;
		await CpeLifecycleService.appendEvent(transaction.id, {
			stage: "CDR_WEBHOOK",
			status,
			source: "SUNAT",
			message: sunatMessage,
			at: payload.occurredAt,
			metadata: {
				invoiceNumber: payload.invoiceNumber,
				sunatCode: payload.sunatCode,
				cdrStatus: payload.cdrStatus,
				providerReference: payload.providerReference,
			},
		});
		await CpeLifecycleService.updateStatus(transaction.id, status, {
			cdrContent: payload.cdrContent,
			sunatCode: payload.sunatCode,
			sunatMessage,
		});

		return {
			success: true,
			transactionId: transaction.id,
			invoiceNumber: payload.invoiceNumber,
			status,
			message: "CDR procesado correctamente",
		};
	}

	static async recordGovernanceDecision(
		transactionId: string,
		trace: unknown,
	): Promise<void> {
		if (!transactionId.trim()) return;
		const traceRecord =
			trace && typeof trace === "object" && !Array.isArray(trace)
				? (trace as Record<string, unknown>)
				: {};
		const decision =
			typeof traceRecord.decision === "string"
				? traceRecord.decision
				: "UNKNOWN";
		const action =
			typeof traceRecord.action === "string"
				? traceRecord.action
				: "electronic_invoice_send";
		const reason =
			typeof traceRecord.reason === "string"
				? traceRecord.reason
				: "Autonomy decision registered";
		await CpeLifecycleService.appendEvent(transactionId, {
			stage: "AUTONOMY_POLICY",
			status: decision,
			source: "SYSTEM",
			message: `${reason} (${action})`,
			metadata: { governance: traceRecord },
		});
	}

	static async getComplianceMetrics(companyId: string) {
		const currentMonth = new Date();
		currentMonth.setDate(1);
		const txns = await CpeRepository.findTransactionsByCompanyAndDate(
			companyId,
			currentMonth,
		);
		const totalSent = txns.length;
		const accepted = txns.filter((t) => t.status === "ACCEPTED").length;
		const rejected = txns.filter((t) => t.status === "REJECTED").length;
		const observed = txns.filter((t) => t.status === "OBSERVED").length;

		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		const recentErrors = await CpeRepository.findRecentRejectedTransactions(
			companyId,
			weekAgo,
		);

		return {
			totalSent,
			accepted,
			rejected,
			observed,
			acceptanceRate: totalSent > 0 ? (accepted / totalSent) * 100 : 0,
			recentErrors: recentErrors.map((t) => ({
				invoiceNumber: `${t.series}-${t.number}`,
				error: ElectronicInvoicingService.getSunatMessageFromTags(t.tags),
				date: t.updatedAt,
			})),
		};
	}

	private static mapCdrStatus(
		status: CdrWebhookPayload["cdrStatus"],
	): ElectronicInvoiceResult["status"] {
		return CdrProcessorService.mapCdrStatus(status);
	}

	private static async resolveTransactionForWebhook(
		payload: CdrWebhookPayload,
		companyId?: string,
	) {
		if (payload.transactionId) {
			const byId = await CpeRepository.findTransactionByIdWithTenant(
				payload.transactionId,
				companyId,
			);
			if (byId) return byId;
		}
		const parsed = ElectronicInvoicingService.parseInvoiceNumber(
			payload.invoiceNumber,
		);
		if (!parsed) return null;
		const invoiceCandidates = await CpeRepository.findInvoicesByInvoiceNumber(
			payload.invoiceNumber,
			companyId,
		);
		if (invoiceCandidates.length === 1) {
			const scopedMatch =
				await ElectronicInvoicingService.findTransactionForInvoiceMatch(
					invoiceCandidates[0],
				);
			if (scopedMatch) return scopedMatch;
		}
		if (invoiceCandidates.length > 1) return null;
		const candidates = await CpeRepository.findTransactionsByCompanyAndSeries(
			invoiceCandidates[0]?.companyId ?? "",
			parsed.series,
			parsed.correlative,
		);
		if (candidates.length === 1) return candidates[0];
		return null;
	}

	private static async findTransactionForInvoiceMatch(input: {
		companyId: string;
		series: string;
		correlative: number;
	}) {
		const candidates = await CpeRepository.findTransactionsByCompanyAndSeries(
			input.companyId,
			input.series,
		);
		const matched = candidates.find(
			(c) =>
				ElectronicInvoicingService.parseInteger(c.number) === input.correlative,
		);
		return matched ? { id: matched.id } : null;
	}

	private static parseInvoiceNumber(
		value: string,
	): { series: string; correlative: string } | null {
		const trimmed = value.trim().toUpperCase();
		if (!trimmed) return null;
		const [series, correlative] = trimmed.split("-");
		if (!series || !correlative) return null;
		return { series, correlative };
	}

	private static parseInteger(value: string | null): number | null {
		if (!value) return null;
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) ? parsed : null;
	}

	private static getSunatMessageFromTags(tags: unknown): string {
		const tagsObj =
			tags && typeof tags === "object" && !Array.isArray(tags)
				? (tags as Record<string, unknown>)
				: {};
		const electronic =
			tagsObj.electronicInvoicing &&
			typeof tagsObj.electronicInvoicing === "object"
				? (tagsObj.electronicInvoicing as Record<string, unknown>)
				: {};
		return typeof electronic.sunatMessage === "string"
			? electronic.sunatMessage
			: "Error desconocido";
	}
}
