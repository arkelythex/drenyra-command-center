/**
 * SunatTaxAuthorityAdapter — TaxAuthorityPort implementation for SUNAT (Peru).
 *
 * Wraps existing SUNAT/OSE/CDR/UBL infrastructure behind the pluggable
 * TaxAuthorityPort interface. The rest of the application should never
 * import SunatApiClient, OSEService, or SunatSireService directly.
 *
 * @module tax-authority/sunat-tax-authority.adapter
 */

import type { TaxAuthorityPort } from "@drenyra/application/ports/tax-authority.port";
import type {
	CDRInfo,
	ConnectivityStatus,
	DocumentValidationResult,
	FiscalRecord,
	InvoiceSubmissionData,
	InvoiceSubmissionResult,
	RegisterDiscrepancy,
	RegisterSyncRequest,
	RegisterSyncResult,
	RegisterSyncStatus,
	TaxIdInfo,
	TaxIdStatus,
} from "@drenyra/application/ports/tax-authority.types";

import type { CountryCode } from "@drenyra/domain";
import { XMLValidator } from "fast-xml-parser";
import { OSEService } from "../ose/ose.service";
import type { RucInfo } from "../sunat/types";
import { SunatApiClient } from "../sunat/SunatApiClient";
import type { SireRecord, SireSyncRequest } from "../sunat/SunatSireService";
import { SunatSireService } from "../sunat/SunatSireService";
import { UBLParser } from "../xml/ubl-parser";

/**
 * Map SUNAT taxpayer status to the generic TaxIdStatus enum.
 */
function mapRucStatus(estado: string, condicion: string): TaxIdStatus {
	if (estado === "ACTIVO" && condicion === "HABIDO") return "ACTIVE";
	if (condicion === "NO HABIDO") return "SUSPENDED";
	if (estado === "BAJA") return "INACTIVE";
	return "UNKNOWN";
}

/**
 * Map register type from generic to SUNAT nomenclature.
 */
function mapRegisterType(tipo: "SALES" | "PURCHASES"): "COMPRAS" | "VENTAS" {
	return tipo === "SALES" ? "VENTAS" : "COMPRAS";
}

/**
 * Map SUNAT register type to generic.
 */
/**
 * Convert a SUNAT SireRecord to a generic FiscalRecord.
 */
function toFiscalRecord(record: SireRecord): FiscalRecord {
	return {
		period: record.periodo,
		documentType: record.tipoComprobante,
		series: record.serie,
		number: record.numero,
		issuerTaxId: record.numeroDocIdentidad,
		issuerName: record.razonSocial,
		issueDate: record.fechaEmision,
		currency: record.moneda,
		total: record.total,
		metadata: {
			correlativo: record.correlativo,
			baseImponible: record.baseImponible,
			igv: record.igv,
			tipoCambio: record.tipoCambio,
			estado: record.estado,
			hashSunat: record.hashSunat,
			fechaRecepcion: record.fechaRecepcion,
		},
	};
}

/**
 * SunatTaxAuthorityAdapter class.
 *
 * @example
 * ```ts
 * const adapter = new SunatTaxAuthorityAdapter(orgId);
 * await adapter.initialize();
 * const info = await adapter.consultTaxId("20546296564");
 * ```
 */
export class SunatTaxAuthorityAdapter implements TaxAuthorityPort {
	readonly countryCode: CountryCode = "PE";
	readonly providerName = "SUNAT";

	private client: SunatApiClient | null = null;
	private sireService: SunatSireService | null = null;
	private ublParser: UBLParser | null = null;
	private organizationId: number;

	constructor(organizationId: number) {
		this.organizationId = organizationId;
	}

	// ─── Initialization ──────────────────────────────────────────────

	async initialize(): Promise<boolean> {
		try {
			this.client = new SunatApiClient(this.organizationId);
			const initialized = await this.client.initialize();
			if (!initialized) {
				this.client = null;
				return false;
			}
			this.sireService = new SunatSireService(this.client);
			this.ublParser = new UBLParser();
			return true;
		} catch {
			this.client = null;
			this.sireService = null;
			return false;
		}
	}

	// ─── Tax ID consultation ─────────────────────────────────────────

	async consultTaxId(taxId: string): Promise<TaxIdInfo> {
		if (!this.client) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		const response = await this.client.consultarRuc(taxId);

		if (!response.success || !response.data) {
			throw new Error(
				response.error?.message ?? "Error consulting RUC with SUNAT",
			);
		}

		const rucInfo: RucInfo = response.data;

		return {
			taxId: rucInfo.ruc,
			legalName: rucInfo.razonSocial,
			status: mapRucStatus(rucInfo.estado, rucInfo.condicion),
			taxIdType: "RUC",
			countryCode: "PE",
			address: rucInfo.direccion,
		};
	}

	// ─── Invoice submission ──────────────────────────────────────────

	async sendInvoice(
		data: InvoiceSubmissionData,
	): Promise<InvoiceSubmissionResult> {
		const oseResult = await OSEService.sendInvoice({
			xmlContent: data.xmlContent,
			invoiceNumber: data.invoiceNumber,
			invoiceType: data.invoiceType,
		});

		const cdr = oseResult.cdrContent
			? this.parseCDR(oseResult.cdrContent)
			: undefined;

    		return {
    			success: oseResult.success,
    			...(cdr !== undefined ? { cdr } : {}),
    			...(oseResult.sunatCode !== undefined
    				? { authorityCode: oseResult.sunatCode }
    				: {}),
    			...(oseResult.sunatDescription !== undefined
    				? { authorityDescription: oseResult.sunatDescription }
    				: {}),
    			...(oseResult.error !== undefined
    				? { error: oseResult.error }
    				: {}),
    			attemptsCount: oseResult.attemptsCount ?? 1,
    		};
	}

	parseCDR(cdrBase64: string): CDRInfo {
		const parsed = OSEService.parseCDR(cdrBase64);

		return {
			status: this.mapCDRStatus(parsed.code),
			code: parsed.code,
			message: parsed.message,
			rawContent: cdrBase64,
		};
	}

	private mapCDRStatus(code: string): CDRInfo["status"] {
		if (code === "0" || code === "ACEPTADO") return "ACCEPTED";
		if (code === "OBSERVADO") return "OBSERVED";
		return "REJECTED";
	}

	// ─── Document validation ─────────────────────────────────────────

	async validateDocument(xml: string): Promise<DocumentValidationResult> {
		if (!this.ublParser) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		const errors: string[] = [];
		const warnings: string[] = [];

		// Step 1: Check XML well-formedness
		const validation = XMLValidator.validate(xml);
		if (validation !== true) {
			const errMsg = validation.err?.msg ?? "Malformed XML";
			errors.push(`XML validation failed: ${errMsg}`);
			return { valid: false, errors, warnings };
		}

		// Step 2: Try to parse as UBL 2.1
		const parseResult = this.ublParser.safeParse(xml);
		if (!parseResult.success || !parseResult.data) {
			errors.push(parseResult.error ?? "Failed to parse UBL 2.1 document");
			return { valid: false, errors, warnings };
		}

		// Step 3: Structural field checks
		const invoice = parseResult.data;
		if (!invoice.supplierRuc || invoice.supplierRuc.length < 11) {
			warnings.push(
				"Supplier RUC may be missing or invalid. Expected 11 digits.",
			);
		}
		if (!invoice.id) {
			errors.push("Invoice ID is required.");
		}
		if (!invoice.issueDate) {
			errors.push("Issue date is required.");
		}
		if (typeof invoice.totalAmount !== "number" || invoice.totalAmount <= 0) {
			errors.push("Total amount must be a positive number.");
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	// ─── Connectivity ────────────────────────────────────────────────

	async checkConnectivity(): Promise<ConnectivityStatus> {
		const status = await OSEService.checkStatus();

		return {
			online: status.online,
			provider: `SUNAT/${status.provider}`,
			message: status.message,
			checkedAt: new Date().toISOString(),
		};
	}

	// ─── Register sync (SIRE) ────────────────────────────────────────

	async requestRegisterDownload(
		request: RegisterSyncRequest,
	): Promise<RegisterSyncStatus> {
		if (!this.sireService) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		const sireRequest: SireSyncRequest = {
			organizationId: this.organizationId,
			ruc: request.taxId,
			periodo: request.period,
			tipo: mapRegisterType(request.registerType),
		};

		const result = await this.sireService.requestDownload(sireRequest);

		if (!result.success || !result.ticket) {
			return {
				ticket: "",
				status: "ERROR",
				message: result.error ?? "Error requesting SIRE download",
			};
		}

		return {
			ticket: result.ticket,
			status: "PENDING",
		};
	}

	async checkRegisterStatus(
		taxId: string,
		ticket: string,
	): Promise<RegisterSyncStatus> {
		if (!this.sireService) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		const status = await this.sireService.checkStatus(taxId, ticket);

		const syncStatusMap: Record<string, RegisterSyncStatus["status"]> = {
			PENDIENTE: "PENDING",
			PROCESANDO: "PROCESSING",
			LISTO: "READY",
			ERROR: "ERROR",
		};

    		return {
    			ticket,
    			status: syncStatusMap[status.estado] ?? "ERROR",
    			...(status.mensaje !== undefined
    				? { message: status.mensaje }
    				: {}),
    			...(status.progreso !== undefined
    				? { progress: status.progreso }
    				: {}),
    		};
	}

	async downloadRegisterFile(
		taxId: string,
		downloadCode: string,
	): Promise<Buffer | null> {
		if (!this.sireService) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		const file = await this.sireService.download(taxId, downloadCode);
		return file?.archivo ?? null;
	}

	findDiscrepancies(
		localRecords: FiscalRecord[],
		authorityRecords: FiscalRecord[],
	): RegisterDiscrepancy[] {
		const discrepancies: RegisterDiscrepancy[] = [];

		// Build lookup maps by document key (series-number)
		const localMap = new Map<string, FiscalRecord>();
		const authorityMap = new Map<string, FiscalRecord>();

		for (const r of localRecords) {
			localMap.set(`${r.series}-${r.number}`, r);
		}
		for (const r of authorityRecords) {
			authorityMap.set(`${r.series}-${r.number}`, r);
		}

		// Records in authority but missing locally
		for (const [key, rec] of authorityMap) {
			if (!localMap.has(key)) {
				discrepancies.push({
					type: "MISSING_LOCAL",
					documentKey: key,
					authorityValue: `${rec.issuerName} - ${(rec.total / 100).toFixed(2)}`,
				});
			}
		}

		// Records locally but missing in authority
		for (const [key, rec] of localMap) {
			if (!authorityMap.has(key)) {
				discrepancies.push({
					type: "MISSING_AUTHORITY",
					documentKey: key,
					localValue: `${rec.issuerName} - ${(rec.total / 100).toFixed(2)}`,
				});
			}
		}

		// Amount mismatches
		for (const [key, localRec] of localMap) {
			const authRec = authorityMap.get(key);
			if (authRec) {
				const diff = Math.abs(localRec.total - authRec.total);
				if (diff > 1) {
					discrepancies.push({
						type: "AMOUNT_MISMATCH",
						documentKey: key,
						localValue: `S/ ${(localRec.total / 100).toFixed(2)}`,
						authorityValue: `S/ ${(authRec.total / 100).toFixed(2)}`,
					});
				}
			}
		}

		return discrepancies;
	}

	async fullRegisterSync(
		request: RegisterSyncRequest,
		localRecords: FiscalRecord[],
		onProgress?: (status: RegisterSyncStatus) => void,
	): Promise<RegisterSyncResult> {
		if (!this.sireService) {
			throw new Error(
				"SunatTaxAuthorityAdapter not initialized. Call initialize() first.",
			);
		}

		// Convert generic FiscalRecord[] back to SireRecord[] for the existing service
		const sireLocalRecords: SireRecord[] = localRecords.map((r) => ({
			periodo: r.period,
			correlativo:
				((r.metadata as Record<string, unknown>)?.correlativo as string) ?? "",
			fechaEmision: r.issueDate,
			tipoComprobante: r.documentType,
			serie: r.series,
			numero: r.number,
			tipoDocIdentidad: r.issuerTaxId.startsWith("2") ? "RUC" : "DNI",
			numeroDocIdentidad: r.issuerTaxId,
			razonSocial: r.issuerName,
			baseImponible: 0,
			igv: ((r.metadata as Record<string, unknown>)?.igv as number) ?? 0,
			total: r.total,
			moneda: r.currency as never,
			tipoCambio: (r.metadata as Record<string, unknown>)?.tipoCambio as
				| number
				| undefined,
			estado: (r.metadata as Record<string, unknown>)?.estado as
				| string
				| undefined,
		}));

		const sireRequest: SireSyncRequest = {
			organizationId: this.organizationId,
			ruc: request.taxId,
			periodo: request.period,
			tipo: mapRegisterType(request.registerType),
		};

		const normalizedOnProgress = onProgress
			? (status: {
					ticket: string;
					estado: "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";
					mensaje?: string;
					progreso?: number;
				}) => {
					const syncStatusMap: Record<string, RegisterSyncStatus["status"]> = {
						PENDIENTE: "PENDING",
						PROCESANDO: "PROCESSING",
						LISTO: "READY",
						ERROR: "ERROR",
					};
    					onProgress({
    						ticket: status.ticket,
    						status: syncStatusMap[status.estado] ?? "ERROR",
    						...(status.mensaje !== undefined
    							? { message: status.mensaje }
    							: {}),
    						...(status.progreso !== undefined
    							? { progress: status.progreso }
    							: {}),
    					});
				}
			: undefined;

		const result = await this.sireService.fullSync(
			sireRequest,
			sireLocalRecords,
			normalizedOnProgress,
		);

		return {
			success: result.success,
			ticket: result.ticket,
			records: result.records?.map(toFiscalRecord),
			totalRecords: result.totalRecords,
			discrepancies: result.discrepancies?.map((d) => ({
				type: this.mapDiscrepancyType(d.tipo),
				documentKey: d.comprobante,
				...(d.detalleLocal !== undefined
					? { localValue: d.detalleLocal }
					: {}),
				...(d.detalleSunat !== undefined
					? { authorityValue: d.detalleSunat }
					: {}),
			})),
			error: result.error,
		};
	}

	private mapDiscrepancyType(tipo: string): RegisterDiscrepancy["type"] {
		switch (tipo) {
			case "FALTA_LOCAL":
				return "MISSING_LOCAL";
			case "FALTA_SUNAT":
				return "MISSING_AUTHORITY";
			case "MONTO_DIFERENTE":
				return "AMOUNT_MISMATCH";
			default:
				return "AMOUNT_MISMATCH";
		}
	}
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * Create a configured SunatTaxAuthorityAdapter for a given organization.
 *
 * @example
 * ```ts
 * const adapter = await createSunatTaxAuthority(orgId);
 * if (adapter) {
 *   const info = await adapter.consultTaxId("20546296564");
 * }
 * ```
 */
export async function createSunatTaxAuthority(
	organizationId: number,
): Promise<SunatTaxAuthorityAdapter | null> {
	const adapter = new SunatTaxAuthorityAdapter(organizationId);
	const initialized = await adapter.initialize();
	return initialized ? adapter : null;
}
