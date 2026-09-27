import { XMLValidator } from "fast-xml-parser";
import { OSEService } from "../ose/ose.service";
import { SunatApiClient } from "../sunat/SunatApiClient";
import { SunatSireService } from "../sunat/SunatSireService";
import { UBLParser } from "../xml/ubl-parser";
function mapRucStatus(estado, condicion) {
    if (estado === "ACTIVO" && condicion === "HABIDO")
        return "ACTIVE";
    if (condicion === "NO HABIDO")
        return "SUSPENDED";
    if (estado === "BAJA")
        return "INACTIVE";
    return "UNKNOWN";
}
function mapRegisterType(tipo) {
    return tipo === "SALES" ? "VENTAS" : "COMPRAS";
}
function _mapFromSunatRegisterType(tipo) {
    return tipo === "VENTAS" ? "SALES" : "PURCHASES";
}
function toFiscalRecord(record) {
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
export class SunatTaxAuthorityAdapter {
    countryCode = "PE";
    providerName = "SUNAT";
    client = null;
    sireService = null;
    ublParser = null;
    organizationId;
    constructor(organizationId) {
        this.organizationId = organizationId;
    }
    async initialize() {
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
        }
        catch {
            this.client = null;
            this.sireService = null;
            return false;
        }
    }
    async consultTaxId(taxId) {
        if (!this.client) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const response = await this.client.consultarRuc(taxId);
        if (!response.success || !response.data) {
            throw new Error(response.error?.message ?? "Error consulting RUC with SUNAT");
        }
        const rucInfo = response.data;
        return {
            taxId: rucInfo.ruc,
            legalName: rucInfo.razonSocial,
            status: mapRucStatus(rucInfo.estado, rucInfo.condicion),
            taxIdType: "RUC",
            countryCode: "PE",
            address: rucInfo.direccion,
        };
    }
    async sendInvoice(data) {
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
            cdr,
            authorityCode: oseResult.sunatCode,
            authorityDescription: oseResult.sunatDescription,
            error: oseResult.error,
            attemptsCount: oseResult.attemptsCount ?? 1,
        };
    }
    parseCDR(cdrBase64) {
        const parsed = OSEService.parseCDR(cdrBase64);
        return {
            status: this.mapCDRStatus(parsed.code),
            code: parsed.code,
            message: parsed.message,
            rawContent: cdrBase64,
        };
    }
    mapCDRStatus(code) {
        if (code === "0" || code === "ACEPTADO")
            return "ACCEPTED";
        if (code === "OBSERVADO")
            return "OBSERVED";
        return "REJECTED";
    }
    async validateDocument(xml) {
        if (!this.ublParser) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const errors = [];
        const warnings = [];
        const validation = XMLValidator.validate(xml);
        if (validation !== true) {
            const errMsg = validation.err?.msg ?? "Malformed XML";
            errors.push(`XML validation failed: ${errMsg}`);
            return { valid: false, errors, warnings };
        }
        const parseResult = this.ublParser.safeParse(xml);
        if (!parseResult.success || !parseResult.data) {
            errors.push(parseResult.error ?? "Failed to parse UBL 2.1 document");
            return { valid: false, errors, warnings };
        }
        const invoice = parseResult.data;
        if (!invoice.supplierRuc || invoice.supplierRuc.length < 11) {
            warnings.push("Supplier RUC may be missing or invalid. Expected 11 digits.");
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
    async checkConnectivity() {
        const status = await OSEService.checkStatus();
        return {
            online: status.online,
            provider: `SUNAT/${status.provider}`,
            message: status.message,
            checkedAt: new Date().toISOString(),
        };
    }
    async requestRegisterDownload(request) {
        if (!this.sireService) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const sireRequest = {
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
    async checkRegisterStatus(taxId, ticket) {
        if (!this.sireService) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const status = await this.sireService.checkStatus(taxId, ticket);
        const syncStatusMap = {
            PENDIENTE: "PENDING",
            PROCESANDO: "PROCESSING",
            LISTO: "READY",
            ERROR: "ERROR",
        };
        return {
            ticket,
            status: syncStatusMap[status.estado] ?? "ERROR",
            message: status.mensaje,
            progress: status.progreso,
        };
    }
    async downloadRegisterFile(taxId, downloadCode) {
        if (!this.sireService) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const file = await this.sireService.download(taxId, downloadCode);
        return file?.archivo ?? null;
    }
    findDiscrepancies(localRecords, authorityRecords) {
        const discrepancies = [];
        const localMap = new Map();
        const authorityMap = new Map();
        for (const r of localRecords) {
            localMap.set(`${r.series}-${r.number}`, r);
        }
        for (const r of authorityRecords) {
            authorityMap.set(`${r.series}-${r.number}`, r);
        }
        for (const [key, rec] of authorityMap) {
            if (!localMap.has(key)) {
                discrepancies.push({
                    type: "MISSING_LOCAL",
                    documentKey: key,
                    authorityValue: `${rec.issuerName} - ${(rec.total / 100).toFixed(2)}`,
                });
            }
        }
        for (const [key, rec] of localMap) {
            if (!authorityMap.has(key)) {
                discrepancies.push({
                    type: "MISSING_AUTHORITY",
                    documentKey: key,
                    localValue: `${rec.issuerName} - ${(rec.total / 100).toFixed(2)}`,
                });
            }
        }
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
    async fullRegisterSync(request, localRecords, onProgress) {
        if (!this.sireService) {
            throw new Error("SunatTaxAuthorityAdapter not initialized. Call initialize() first.");
        }
        const sireLocalRecords = localRecords.map((r) => ({
            periodo: r.period,
            correlativo: r.metadata?.correlativo ?? "",
            fechaEmision: r.issueDate,
            tipoComprobante: r.documentType,
            serie: r.series,
            numero: r.number,
            tipoDocIdentidad: r.issuerTaxId.startsWith("2") ? "RUC" : "DNI",
            numeroDocIdentidad: r.issuerTaxId,
            razonSocial: r.issuerName,
            baseImponible: 0,
            igv: r.metadata?.igv ?? 0,
            total: r.total,
            moneda: r.currency,
            tipoCambio: r.metadata?.tipoCambio,
            estado: r.metadata?.estado,
        }));
        const sireRequest = {
            organizationId: this.organizationId,
            ruc: request.taxId,
            periodo: request.period,
            tipo: mapRegisterType(request.registerType),
        };
        const normalizedOnProgress = onProgress
            ? (status) => {
                const syncStatusMap = {
                    PENDIENTE: "PENDING",
                    PROCESANDO: "PROCESSING",
                    LISTO: "READY",
                    ERROR: "ERROR",
                };
                onProgress({
                    ticket: status.ticket,
                    status: syncStatusMap[status.estado] ?? "ERROR",
                    message: status.mensaje,
                    progress: status.progreso,
                });
            }
            : undefined;
        const result = await this.sireService.fullSync(sireRequest, sireLocalRecords, normalizedOnProgress);
        return {
            success: result.success,
            ticket: result.ticket,
            records: result.records?.map(toFiscalRecord),
            totalRecords: result.totalRecords,
            discrepancies: result.discrepancies?.map((d) => ({
                type: this.mapDiscrepancyType(d.tipo),
                documentKey: d.comprobante,
                localValue: d.detalleLocal,
                authorityValue: d.detalleSunat,
            })),
            error: result.error,
        };
    }
    mapDiscrepancyType(tipo) {
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
export async function createSunatTaxAuthority(organizationId) {
    const adapter = new SunatTaxAuthorityAdapter(organizationId);
    const initialized = await adapter.initialize();
    return initialized ? adapter : null;
}
//# sourceMappingURL=sunat-tax-authority.adapter.js.map