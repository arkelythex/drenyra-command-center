/**
 * CPE Tracking Service
 *
 * Orchestrates SUNAT CPE communication log lifecycle.
 */

import {
	CPELog,
	InvalidCPELogError,
	type SunatStatus,
} from "@drenyra/domain/accounting/cpe-log";
import type { CpeLogRepository } from "@drenyra/domain/repositories/cpe-log.repository";

export interface RegisterCPEDTO {
	id: string;
	invoiceId: string;
	companyId: string;
}

export interface CDRMetadata {
	cdrXmlHash: string;
	cdrResponseCode: string;
	cdrObservations?: string;
	fechaRecepcion: Date;
}

export class CpeTrackingService {
	constructor(
		private readonly cpeLogRepo: CpeLogRepository,
	) {}

	/**
	 * Register a new CPE log entry when an invoice is created.
	 */
	async registerCPE(dto: RegisterCPEDTO): Promise<CPELog> {
		if (!dto.companyId || dto.companyId.trim().length === 0) {
			throw new InvalidCPELogError("companyId", "Company ID is required");
		}

		// Create domain entity (validates id, invoiceId internally)
		const log = CPELog.create(dto.id, dto.invoiceId);

		await this.cpeLogRepo.save(log, dto.companyId);

		return log;
	}

	/**
	 * Update the submission status after sending to SUNAT.
	 * When ticket is provided, it transitions to "enviado".
	 */
	async submitCPE(
		id: string,
		_companyId: string,
		ticket: string,
		hashValue: string,
		hashAlgorithm?: string,
	): Promise<CPELog> {
		const log = await this.cpeLogRepo.findById(id);
		if (!log) {
			throw new InvalidCPELogError("id", `CPE log not found: ${id}`);
		}

		if (!ticket || ticket.trim().length === 0) {
			throw new InvalidCPELogError("sunatTicket", "SUNAT ticket is required");
		}

		// State transition via domain entity
		const updated = log.submit(ticket, hashValue, hashAlgorithm ?? "SHA-256");

		// Persist the updated status
		await this.cpeLogRepo.updateStatus(id, "enviado", {
			sunatTicket: ticket,
			hashValue: updated.hashValue ?? undefined,
			hashAlgorithm: updated.hashAlgorithm ?? undefined,
			submittedAt: updated.submittedAt ?? undefined,
		});

		return updated;
	}

	/**
	 * Record SUNAT response (accept/reject/observe) for a CPE.
	 */
	async updateSubmission(
		ticket: string,
		status: SunatStatus,
		cdr?: CDRMetadata,
	): Promise<void> {
		const log = await this.cpeLogRepo.findByTicket(ticket);
		if (!log) {
			throw new InvalidCPELogError(
				"sunatTicket",
				`No CPE log found with ticket: ${ticket}`,
			);
		}

		const metadata: {
			sunatTicket?: string;
			cdrData?: Record<string, unknown>;
			errorMessage?: string;
			errorCode?: string;
			acceptedAt?: Date;
			rejectedAt?: Date;
			observedAt?: Date;
		} = {
			sunatTicket: ticket,
		};

		if (status === "aceptado" && cdr) {
			metadata.acceptedAt = new Date();
			metadata.cdrData = {
				id: cdr.cdrXmlHash,
				content: "",
				resultCode: cdr.cdrResponseCode,
				resultDescription: cdr.cdrObservations ?? "",
				ticket,
				receivedAt: cdr.fechaRecepcion.toISOString(),
			};
		} else if (status === "rechazado") {
			metadata.rejectedAt = new Date();
			metadata.errorMessage = cdr?.cdrObservations ?? "Rechazado por SUNAT";
			metadata.errorCode = cdr?.cdrResponseCode;
		} else if (status === "observado") {
			metadata.observedAt = new Date();
			metadata.errorMessage = cdr?.cdrObservations ?? "Observado por SUNAT";
		}

		await this.cpeLogRepo.updateStatus(log.id, status, metadata);
	}

	/**
	 * Get CPE log by invoice ID.
	 */
	async getByInvoice(invoiceId: string): Promise<CPELog | null> {
		if (!invoiceId || invoiceId.trim().length === 0) {
			throw new InvalidCPELogError("invoiceId", "Invoice ID is required");
		}

		return this.cpeLogRepo.findByInvoiceId(invoiceId);
	}

	/**
	 * Get all pending CPE logs for a company.
	 */
	async getPendingByCompany(companyId: string): Promise<CPELog[]> {
		return this.cpeLogRepo.findByStatus(companyId, "pendiente");
	}

	/**
	 * Get all submitted CPE logs for a company.
	 */
	async getSubmittedByCompany(companyId: string): Promise<CPELog[]> {
		return this.cpeLogRepo.findByStatus(companyId, "enviado");
	}
}
