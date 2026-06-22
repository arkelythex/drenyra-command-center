import type { PleCompraRecord, PleConfig, PleDiarioRecord, PleGenerationResult, PleVentaRecord } from "./types.js";
import { formatDate, formatDateOptional, formatDecimal, formatDecimalOptional, calculateChecksum } from "./formatting.js";

export class SunatPleGenerator {
	private config: PleConfig;
	private readonly separator = "|";
	private readonly lineBreak = "\r\n";

	constructor(config: PleConfig) {
		this.config = config;
		this.validateConfig();
	}

	private validateConfig(): void {
		if (!this.config.ruc || this.config.ruc.length !== 11) {
			throw new Error("RUC debe tener 11 dígitos");
		}

		if (!this.config.periodo || !/^\d{6}$/.test(this.config.periodo)) {
			throw new Error("Periodo debe ser en formato YYYYMM");
		}
	}

	generateLibroCompras(records: PleCompraRecord[]): PleGenerationResult {
		try {
			const lines: string[] = [];

			for (const record of records) {
				const line = [
					record.periodo,
					record.cuo,
					record.correlativo,
					formatDate(record.fechaEmision),
					formatDateOptional(record.fechaVencimiento),
					record.tipoComprobante,
					record.serieComprobante,
					record.anioEmisionDua || "",
					record.numeroComprobante,
					record.numeroFinal || "",
					record.tipoDocProveedor,
					record.numeroDocProveedor,
					record.razonSocialProveedor,
					formatDecimal(record.baseImponible),
					formatDecimal(record.igv),
					formatDecimal(record.baseImponibleNoGravada || 0),
					formatDecimal(record.igvNoGravado || 0),
					formatDecimal(record.baseImponibleExportacion || 0),
					formatDecimal(0),
					formatDecimal(0),
					formatDecimal(0),
					formatDecimal(record.montoTotal),
					record.codigoMoneda,
					formatDecimalOptional(record.tipoCambio),
					formatDateOptional(record.fechaEmisionModificado),
					record.tipoComprobanteModificado || "",
					record.serieModificado || "",
					record.codigoDua || "",
					record.numeroModificado || "",
					formatDateOptional(record.fechaDetraccion),
					record.numeroDetraccion || "",
					formatDecimalOptional(record.retencion),
					record.clasificacionBienesServicios || "",
					record.identificadorContrato || "",
					record.errorTipo1 || "",
					record.cancelacion || "",
					record.estadoOperacion,
					"",
					"",
					"",
					"",
					"",
					"",
				].join(this.separator);

				lines.push(line);
			}

			const content = lines.join(this.lineBreak);
			const fileName = this.generateFileName("080100", records.length > 0);
			const checksum = calculateChecksum(content);

			return {
				success: true,
				fileName,
				content,
				recordCount: records.length,
				checksum,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al generar libro de compras",
			};
		}
	}

	generateLibroVentas(records: PleVentaRecord[]): PleGenerationResult {
		try {
			const lines: string[] = [];

			for (const record of records) {
				const line = [
					record.periodo,
					record.cuo,
					record.correlativo,
					formatDate(record.fechaEmision),
					formatDateOptional(record.fechaVencimiento),
					record.tipoComprobante,
					record.serieComprobante,
					record.numeroComprobante,
					record.numeroFinal || "",
					record.tipoDocCliente,
					record.numeroDocCliente,
					record.razonSocialCliente,
					formatDecimal(record.valorExportacion || 0),
					formatDecimal(record.baseImponible),
					formatDecimal(record.descuentoBaseImponible || 0),
					formatDecimal(record.igv),
					formatDecimal(record.descuentoIgv || 0),
					formatDecimal(record.exonerado || 0),
					formatDecimal(record.inafecto || 0),
					formatDecimal(record.isc || 0),
					formatDecimal(record.baseIvap || 0),
					formatDecimal(record.ivap || 0),
					formatDecimal(record.icbper || 0),
					formatDecimal(record.otros || 0),
					formatDecimal(record.montoTotal),
					record.codigoMoneda,
					formatDecimalOptional(record.tipoCambio),
					formatDateOptional(record.fechaEmisionModificado),
					record.tipoComprobanteModificado || "",
					record.serieModificado || "",
					record.numeroModificado || "",
					record.identificadorContrato || "",
					record.errorTipo1 || "",
					record.cancelacion || "",
					record.estadoOperacion,
				].join(this.separator);

				lines.push(line);
			}

			const content = lines.join(this.lineBreak);
			const fileName = this.generateFileName("140100", records.length > 0);
			const checksum = calculateChecksum(content);

			return {
				success: true,
				fileName,
				content,
				recordCount: records.length,
				checksum,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al generar libro de ventas",
			};
		}
	}

	generateLibroDiario(records: PleDiarioRecord[]): PleGenerationResult {
		try {
			const lines: string[] = [];

			for (const record of records) {
				const line = [
					record.periodo,
					record.cuo,
					record.correlativo,
					record.cuentaContable,
					record.centroCoste || "",
					record.tipoMoneda,
					record.tipoDocIdentidad || "",
					record.numeroDocIdentidad || "",
					record.tipoComprobante || "",
					record.serieComprobante || "",
					record.numeroComprobante || "",
					formatDate(record.fechaContable),
					formatDateOptional(record.fechaVencimiento),
					formatDateOptional(record.fechaOperacion),
					record.glosa.substring(0, 200),
					record.glosaReferencial || "",
					formatDecimal(record.debe),
					formatDecimal(record.haber),
					record.datoEstructurado || "",
					record.estadoOperacion,
				].join(this.separator);

				lines.push(line);
			}

			const content = lines.join(this.lineBreak);
			const fileName = this.generateFileName("050100", records.length > 0);
			const checksum = calculateChecksum(content);

			return {
				success: true,
				fileName,
				content,
				recordCount: records.length,
				checksum,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al generar libro diario",
			};
		}
	}

	private generateFileName(codigoLibro: string, hasContent: boolean): string {
		const year = this.config.periodo.substring(0, 4);
		const month = this.config.periodo.substring(4, 6);
		const day = "01";

		const oportunidad = "0";
		const operacion = "0";
		const contenido = hasContent ? "1" : "0";
		const moneda = "1";
		const generado = "1";

		return `LE${this.config.ruc}${year}${month}${day}${codigoLibro}${oportunidad}${operacion}${contenido}${moneda}${generado}.txt`;
	}
}

export function createPleGenerator(config: PleConfig): SunatPleGenerator {
	return new SunatPleGenerator(config);
}
