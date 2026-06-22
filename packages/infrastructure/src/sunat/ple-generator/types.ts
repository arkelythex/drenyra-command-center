export interface PleConfig {
	ruc: string;
	razonSocial: string;
	periodo: string; // YYYYMM
	tipoLibro: PleBookType;
}

export type PleBookType =
	| "080100" // 8.1 Registro de Compras
	| "140100" // 14.1 Registro de Ventas
	| "050100" // 5.1 Libro Diario
	| "030100" // 3.1 Balance de Comprobación
	| "060100" // 6.1 Libro Mayor
	| "010300"; // 1.3 Libro Caja y Bancos - Detalle

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
	estadoOperacion: "1" | "2" | "6" | "7" | "9";
}

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

export interface PleGenerationResult {
	success: boolean;
	fileName?: string;
	content?: string;
	recordCount?: number;
	checksum?: string;
	error?: string;
}
