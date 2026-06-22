/**
 * SUNAT PLE Generator
 *
 * Generates Libros Electrónicos (PLE) in the format required by SUNAT.
 *
 * Supported Books:
 * - 8.1 Registro de Compras
 * - 14.1 Registro de Ventas e Ingresos
 * - 5.1 Libro Diario
 * - 3.1 Libro de Inventarios y Balances - Balance de Comprobación
 *
 * File naming convention:
 * LE + RUC (11) + Año (4) + Mes (2) + Día (2) + Código Libro (6) + Oportunidad (1) +
 * Operación (1) + Contenido (1) + Moneda (1) + Generado (1)
 *
 * Example: LE20123456789202501001408010200011.txt
 * @example
 * ```ts
 * const value: PleConfig = {} as PleConfig;
 * console.log(value);
 * ```
 */

export interface PleConfig {
	ruc: string;
	razonSocial: string;
	periodo: string; // YYYYMM
	tipoLibro: PleBookType;
}

/**
 * PleBookType type.
 *
 * @example
 * ```ts
 * const value: PleBookType = {} as PleBookType;
 * console.log(value);
 * ```
 */
export type PleBookType =
	| "080100" // 8.1 Registro de Compras
	| "140100" // 14.1 Registro de Ventas
	| "050100" // 5.1 Libro Diario
	| "030100" // 3.1 Balance de Comprobación
	| "060100" // 6.1 Libro Mayor
	| "010300"; // 1.3 Libro Caja y Bancos - Detalle

/**
 * PleCompraRecord interface.
 *
 * @example
 * ```ts
 * const value: PleCompraRecord = {} as PleCompraRecord;
 * console.log(value);
 * ```
 */
export interface PleCompraRecord {
	periodo: string;
	cuo: string; // Código Único de Operación
	correlativo: string;
	fechaEmision: Date;
	fechaVencimiento?: Date;
	tipoComprobante: string;
	serieComprobante: string;
	anioEmisionDua?: string;
	numeroComprobante: string;
	numeroFinal?: string;
	tipoDocProveedor: string;
	numeroDocProveedor: string;
	razonSocialProveedor: string;
	baseImponible: number;
	igv: number;
	baseImponibleNoGravada?: number;
	igvNoGravado?: number;
	baseImponibleExportacion?: number;
	montoTotal: number;
	codigoMoneda: string;
	tipoCambio?: number;
	fechaEmisionModificado?: Date;
	tipoComprobanteModificado?: string;
	serieModificado?: string;
	codigoDua?: string;
	numeroModificado?: string;
	fechaDetraccion?: Date;
	numeroDetraccion?: string;
	retencion?: number;
	clasificacionBienesServicios?: string;
	identificadorContrato?: string;
	errorTipo1?: string;
	cancelacion?: string;
	estadoOperacion: "1" | "2" | "6" | "7" | "9"; // 1=Registrado, 2=Modificado, etc.
}

/**
 * PleVentaRecord interface.
 *
 * @example
 * ```ts
 * const value: PleVentaRecord = {} as PleVentaRecord;
 * console.log(value);
 * ```
 */
export interface PleVentaRecord {
	periodo: string;
	cuo: string;
	correlativo: string;
	fechaEmision: Date;
	fechaVencimiento?: Date;
	tipoComprobante: string;
	serieComprobante: string;
	numeroComprobante: string;
	numeroFinal?: string;
	tipoDocCliente: string;
	numeroDocCliente: string;
	razonSocialCliente: string;
	valorExportacion?: number;
	baseImponible: number;
	descuentoBaseImponible?: number;
	igv: number;
	descuentoIgv?: number;
	exonerado?: number;
	inafecto?: number;
	isc?: number;
	baseIvap?: number;
	ivap?: number;
	icbper?: number;
	otros?: number;
	montoTotal: number;
	codigoMoneda: string;
	tipoCambio?: number;
	fechaEmisionModificado?: Date;
	tipoComprobanteModificado?: string;
	serieModificado?: string;
	numeroModificado?: string;
	identificadorContrato?: string;
	errorTipo1?: string;
	cancelacion?: string;
	estadoOperacion: "1" | "2" | "6" | "7" | "9";
}

/**
 * PleDiarioRecord interface.
 *
 * @example
 * ```ts
 * const value: PleDiarioRecord = {} as PleDiarioRecord;
 * console.log(value);
 * ```
 */
export interface PleDiarioRecord {
	periodo: string;
	cuo: string;
	correlativo: string;
	cuentaContable: string;
	centroCoste?: string;
	tipoMoneda: string;
	tipoDocIdentidad?: string;
	numeroDocIdentidad?: string;
	tipoComprobante?: string;
	serieComprobante?: string;
	numeroComprobante?: string;
	fechaContable: Date;
	fechaVencimiento?: Date;
	fechaOperacion?: Date;
	glosa: string;
	glosaReferencial?: string;
	debe: number;
	haber: number;
	datoEstructurado?: string;
	estadoOperacion: "1" | "8" | "9";
}

/**
 * PleGenerationResult interface.
 *
 * @example
 * ```ts
 * const value: PleGenerationResult = {} as PleGenerationResult;
 * console.log(value);
 * ```
 */
export interface PleGenerationResult {
	success: boolean;
	fileName?: string;
	content?: string;
	recordCount?: number;
	checksum?: string;
	error?: string;
}

// ============================================
// PLE GENERATOR CLASS
// ============================================

/**
 * SunatPleGenerator class.
 *
 * @example
 * ```ts
 * const value = new SunatPleGenerator();
 * console.log(value);
 * ```
 */
export class SunatPleGenerator {
	private config: PleConfig;
	private readonly separator = "|";
	private readonly lineBreak = "\r\n";

	constructor(config: PleConfig) {
		this.config = config;
		this.validateConfig();
	}

	/**
	 * Validate configuration
	 */
	private validateConfig(): void {
		if (!this.config.ruc || this.config.ruc.length !== 11) {
			throw new Error("RUC debe tener 11 dígitos");
		}

		if (!this.config.periodo || !/^\d{6}$/.test(this.config.periodo)) {
			throw new Error("Periodo debe ser en formato YYYYMM");
		}
	}

	/**
	 * Generate Registro de Compras (8.1)
	 */
	generateLibroCompras(records: PleCompraRecord[]): PleGenerationResult {
		try {
			const lines: string[] = [];

			for (const record of records) {
				const line = [
					record.periodo,
					record.cuo,
					record.correlativo,
					this.formatDate(record.fechaEmision),
					this.formatDateOptional(record.fechaVencimiento),
					record.tipoComprobante,
					record.serieComprobante,
					record.anioEmisionDua || "",
					record.numeroComprobante,
					record.numeroFinal || "",
					record.tipoDocProveedor,
					record.numeroDocProveedor,
					record.razonSocialProveedor,
					this.formatDecimal(record.baseImponible),
					this.formatDecimal(record.igv),
					this.formatDecimal(record.baseImponibleNoGravada || 0),
					this.formatDecimal(record.igvNoGravado || 0),
					this.formatDecimal(record.baseImponibleExportacion || 0),
					this.formatDecimal(0), // ISC
					this.formatDecimal(0), // ICBPER
					this.formatDecimal(0), // Otros
					this.formatDecimal(record.montoTotal),
					record.codigoMoneda,
					this.formatDecimalOptional(record.tipoCambio),
					this.formatDateOptional(record.fechaEmisionModificado),
					record.tipoComprobanteModificado || "",
					record.serieModificado || "",
					record.codigoDua || "",
					record.numeroModificado || "",
					this.formatDateOptional(record.fechaDetraccion),
					record.numeroDetraccion || "",
					this.formatDecimalOptional(record.retencion),
					record.clasificacionBienesServicios || "",
					record.identificadorContrato || "",
					record.errorTipo1 || "",
					record.cancelacion || "",
					record.estadoOperacion,
					"", // Campo libre (37)
					"", // Campo libre (38)
					"", // Campo libre (39)
					"", // Campo libre (40)
					"", // Campo libre (41)
					"", // Campo libre (42)
				].join(this.separator);

				lines.push(line);
			}

			const content = lines.join(this.lineBreak);
			const fileName = this.generateFileName("080100", records.length > 0);
			const checksum = this.calculateChecksum(content);

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

	/**
	 * Generate Registro de Ventas (14.1)
	 */
	generateLibroVentas(records: PleVentaRecord[]): PleGenerationResult {
		try {
			const lines: string[] = [];

			for (const record of records) {
				const line = [
					record.periodo,
					record.cuo,
					record.correlativo,
					this.formatDate(record.fechaEmision),
					this.formatDateOptional(record.fechaVencimiento),
					record.tipoComprobante,
					record.serieComprobante,
					record.numeroComprobante,
					record.numeroFinal || "",
					record.tipoDocCliente,
					record.numeroDocCliente,
					record.razonSocialCliente,
					this.formatDecimal(record.valorExportacion || 0),
					this.formatDecimal(record.baseImponible),
					this.formatDecimal(record.descuentoBaseImponible || 0),
					this.formatDecimal(record.igv),
					this.formatDecimal(record.descuentoIgv || 0),
					this.formatDecimal(record.exonerado || 0),
					this.formatDecimal(record.inafecto || 0),
					this.formatDecimal(record.isc || 0),
					this.formatDecimal(record.baseIvap || 0),
					this.formatDecimal(record.ivap || 0),
					this.formatDecimal(record.icbper || 0),
					this.formatDecimal(record.otros || 0),
					this.formatDecimal(record.montoTotal),
					record.codigoMoneda,
					this.formatDecimalOptional(record.tipoCambio),
					this.formatDateOptional(record.fechaEmisionModificado),
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
			const checksum = this.calculateChecksum(content);

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

	/**
	 * Generate Libro Diario (5.1)
	 */
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
					this.formatDate(record.fechaContable),
					this.formatDateOptional(record.fechaVencimiento),
					this.formatDateOptional(record.fechaOperacion),
					record.glosa.substring(0, 200), // Max 200 chars
					record.glosaReferencial || "",
					this.formatDecimal(record.debe),
					this.formatDecimal(record.haber),
					record.datoEstructurado || "",
					record.estadoOperacion,
				].join(this.separator);

				lines.push(line);
			}

			const content = lines.join(this.lineBreak);
			const fileName = this.generateFileName("050100", records.length > 0);
			const checksum = this.calculateChecksum(content);

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

	/**
	 * Generate file name according to SUNAT specifications
	 */
	private generateFileName(codigoLibro: string, hasContent: boolean): string {
		const year = this.config.periodo.substring(0, 4);
		const month = this.config.periodo.substring(4, 6);
		const day = "01"; // Day of period

		// Structure: LE + RUC + YYYYMMDD + CodLibro + Oportunidad + Operacion + Contenido + Moneda + Generado
		const oportunidad = "0"; // 0 = Cierre mensual
		const operacion = "0"; // 0 = Informacion normal
		const contenido = hasContent ? "1" : "0"; // 1 = Con info, 0 = Sin info
		const moneda = "1"; // 1 = Soles
		const generado = "1"; // 1 = Generado por sistema

		return `LE${this.config.ruc}${year}${month}${day}${codigoLibro}${oportunidad}${operacion}${contenido}${moneda}${generado}.txt`;
	}

	/**
	 * Format date as DD/MM/YYYY
	 */
	private formatDate(date: Date): string {
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	}

	/**
	 * Format optional date
	 */
	private formatDateOptional(date?: Date): string {
		if (!date) return "";
		return this.formatDate(date);
	}

	/**
	 * Format decimal with 2 decimal places
	 */
	private formatDecimal(value: number): string {
		return value.toFixed(2);
	}

	/**
	 * Format optional decimal
	 */
	private formatDecimalOptional(value?: number): string {
		if (value === undefined || value === null) return "";
		return this.formatDecimal(value);
	}

	/**
	 * Calculate checksum (simplified - in production use SHA-256)
	 */
	private calculateChecksum(content: string): string {
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
	}
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * createPleGenerator operation.
 *
 * @param config - Input for config.
 * @returns Result of createPleGenerator.
 * @example
 * ```ts
 * const result = createPleGenerator({} as PleConfig);
 * console.log(result);
 * ```
 */
export function createPleGenerator(config: PleConfig): SunatPleGenerator {
	return new SunatPleGenerator(config);
}
