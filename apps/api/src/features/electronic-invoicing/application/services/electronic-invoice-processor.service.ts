/**
 * Electronic Invoice Processor Service.
 *
 * Canonical feature application service for the SUNAT/OSE processing flow.
 * The legacy `apps/api/src/services/electronic-invoicing.service.ts` facade
 * delegates here to preserve compatibility while keeping orchestration inside
 * the electronic-invoicing vertical slice.
 */

import { loadCertificateFromPfx, signXml } from "../../../../features/sunat";
import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../../lib/compliance-runbooks";
import { createLogger } from "../../../../lib/logger";
import { getTaxAuthority } from "../../../../lib/tax-authority-provider";
import type {
	ElectronicInvoiceData,
	ElectronicInvoiceResult,
} from "../../domain/cpe.types";
import { CpeRepository } from "../../infrastructure/cpe.repository";
import { CdrProcessorService } from "./cdr-processor.service";
import { CpeLifecycleService } from "./cpe-lifecycle.service";
import { DataConsistencyService } from "./data-consistency.service";
import { XmlParserService } from "./xml-parser.service";

const logger = createLogger({
	module: "features/electronic-invoicing/electronic-invoice-processor",
});

function loadCert() {
	return loadCertificateFromPfx(
		process.env.CERTIFICATE_PFX_PATH || "./certificates/certificate.pfx",
		process.env.CERTIFICATE_PASSWORD || "",
	);
}

/**
 * ElectronicInvoiceProcessorService class.
 *
 * @example
 * ```ts
 * const value = new ElectronicInvoiceProcessorService();
 * console.log(value);
 * ```
 */
export class ElectronicInvoiceProcessorService {
	static async processElectronicInvoice(
		data: ElectronicInvoiceData,
	): Promise<ElectronicInvoiceResult> {
		const startTime = Date.now();

		try {
			logger.info(
				{
					companyId: data.companyId,
					invoiceNumber: data.invoiceNumber,
					transactionId: data.transactionId,
				},
				"Starting electronic invoice processing",
			);
			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "PROCESS_START",
				status: "INFO",
				source: "SYSTEM",
				message: "Inicio de procesamiento de facturación electrónica",
			});

			const transaction = await CpeRepository.findTransactionByIdAndCompany(
				data.transactionId,
				data.companyId,
			);
			if (!transaction) {
				throw new Error(
					`Transacción no encontrada en tenant ${data.companyId}: ${data.transactionId}`,
				);
			}
			if (transaction.status !== "DRAFT") {
				throw new Error(
					`Transacción ${data.transactionId} ya procesada (estado: ${transaction.status})`,
				);
			}

			logger.info(
				{ transactionId: data.transactionId },
				"Validating UBL 2.1 XML",
			);
			const validationResult = await XmlParserService.parseAndValidate(
				data.xmlContent,
			);
			if (!validationResult.valid) {
				throw new Error(`XML inválido: ${validationResult.error}`);
			}
			if (!validationResult.data) {
				throw new Error("XML inválido: no se pudo extraer información mínima");
			}
			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "XML_VALIDATION",
				status: "SUCCESS",
				source: "SYSTEM",
				message: "Validación XML UBL completada",
			});

			await DataConsistencyService.verify(transaction, validationResult.data);
			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "DATA_CONSISTENCY",
				status: "SUCCESS",
				source: "SYSTEM",
				message: "Consistencia XML/BD validada",
			});

			logger.info(
				{ transactionId: data.transactionId },
				"Signing XML digitally",
			);
			const cert = loadCert();
			const signedXML = signXml(data.xmlContent, cert);
			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "XML_SIGNATURE",
				status: "SIGNED",
				source: "SYSTEM",
				message: "Firma digital aplicada",
			});

			logger.info(
				{ transactionId: data.transactionId },
				"Submitting invoice to tax authority",
			);
			const taxAuthority = await getTaxAuthority(Number(data.companyId), "PE");
			const submissionResult = await taxAuthority.sendInvoice({
				xmlContent: signedXML,
				invoiceNumber: data.invoiceNumber,
				invoiceType: data.invoiceType,
				countryCode: "PE" as const,
				issuerTaxId: "", // Resolved from company data in a future iteration
			});
			const oseResult = mapSubmissionToOseResult(submissionResult);
			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "OSE_SUBMISSION",
				status: oseResult.success ? "SENT" : "ERROR",
				source: "SYSTEM",
				message: oseResult.success
					? "Comprobante enviado para procesamiento"
					: (oseResult.error ?? "No se pudo enviar comprobante"),
			});

			const result = await CdrProcessorService.processResponse(
				data.transactionId,
				oseResult,
				async (_tid: string, event: Record<string, unknown>) => {
					await CpeLifecycleService.appendEvent(
						_tid,
						event as Parameters<typeof CpeLifecycleService.appendEvent>[1],
					);
				},
				async (
					_tid: string,
					status: string,
					metadata: Record<string, unknown>,
				) => {
					await CpeLifecycleService.updateStatus(
						_tid,
						status as ElectronicInvoiceResult["status"],
						metadata,
					);
				},
			);

			logger.info(
				{
					processingTimeMs: Date.now() - startTime,
					success: result.success,
					status: result.status,
				},
				"Electronic invoice processing completed",
			);
			return { ...result, processingTime: Date.now() - startTime };
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error(
				{
					error,
					companyId: data.companyId,
					invoiceNumber: data.invoiceNumber,
					processingTimeMs: processingTime,
				},
				"Electronic invoice processing failed",
			);

			await CpeLifecycleService.appendEvent(data.transactionId, {
				stage: "PROCESS_ERROR",
				status: "ERROR",
				source: "SYSTEM",
				message: error instanceof Error ? error.message : "Error desconocido",
				metadata: { runbookId: CPE_COMPLIANCE_INCIDENT_RUNBOOK.id },
			});
			await CpeLifecycleService.updateStatus(data.transactionId, "ANNULLED", {
				sunatMessage:
					error instanceof Error ? error.message : "Error desconocido",
				sunatCode: "PROCESSING_ERROR",
			});

			return {
				success: false,
				transactionId: data.transactionId,
				status: "ANNULLED",
				error: error instanceof Error ? error.message : "Error desconocido",
				processingTime,
				runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
			};
		}
	}
}

/**
 * Map TaxAuthorityPort.InvoiceSubmissionResult to the expected OSE result format
 * used by CdrProcessorService.
 */
function mapSubmissionToOseResult(
	result: import("@drenyra/application/ports/tax-authority.types").InvoiceSubmissionResult,
): {
	success: boolean;
	cdrContent?: string;
	cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
	cdrMessage?: string;
	sunatCode?: string;
	sunatDescription?: string;
	error?: string;
} {
	const cdrStatusMap: Record<
		string,
		"ACEPTADO" | "RECHAZADO" | "OBSERVADO" | undefined
	> = {
		ACCEPTED: "ACEPTADO",
		REJECTED: "RECHAZADO",
		OBSERVED: "OBSERVADO",
	};

	return {
		success: result.success,
		cdrContent: result.cdr?.rawContent,
		cdrStatus: result.cdr ? cdrStatusMap[result.cdr.status] : undefined,
		cdrMessage: result.cdr?.message,
		sunatCode: result.authorityCode,
		sunatDescription: result.authorityDescription,
		error: result.error,
	};
}
