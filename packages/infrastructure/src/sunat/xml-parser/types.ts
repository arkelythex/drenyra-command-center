export interface UblInvoice {
	tipoDocumento: "01" | "03" | "07" | "08";
	serie: string;
	numero: string;
	fechaEmision: Date;
	fechaVencimiento?: Date;
	emisorRuc: string;
	emisorRazonSocial: string;
	emisorDireccion?: string;
	receptorTipoDoc: "6" | "1" | "0";
	receptorNumDoc: string;
	receptorRazonSocial: string;
	receptorDireccion?: string;
	moneda: import("@arkelythex/domain").Currency;
	subtotal: number;
	descuentos: number;
	igv: number;
	otrosTributos: number;
	total: number;
	tieneDetraccion: boolean;
	codigoDetraccion?: string;
	porcentajeDetraccion?: number;
	montoDetraccion?: number;
	items: UblInvoiceItem[];
	hashCpe?: string;
	firmaDigital?: string;
	cdrEstado?: string;
	cdrCodigo?: string;
	cdrDescripcion?: string;
}

export interface UblInvoiceItem {
	id: string;
	codigo?: string;
	descripcion: string;
	unidadMedida: string;
	cantidad: number;
	precioUnitario: number;
	valorVenta: number;
	igv: number;
	total: number;
	tipoAfectacionIgv: string;
}

export interface ParseResult {
	success: boolean;
	invoice?: UblInvoice;
	errors?: string[];
	warnings?: string[];
}

export const DOCUMENT_TYPE_NAMES: Record<string, string> = {
	"01": "Factura",
	"03": "Boleta de Venta",
	"07": "Nota de Crédito",
	"08": "Nota de Débito",
};

export const IGV_AFFECTATION_NAMES: Record<string, string> = {
	"10": "Gravado",
	"20": "Exonerado",
	"30": "Inafecto",
};
