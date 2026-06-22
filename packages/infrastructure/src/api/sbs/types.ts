export interface TipoCambio {
	fecha: string;
	moneda: "USD" | "EUR";
	compra: number;
	venta: number;
	fuente: string;
}

export interface TipoCambioHistorico {
	fechaInicio: string;
	fechaFin: string;
	moneda: "USD" | "EUR";
	datos: Array<{
		fecha: string;
		compra: number;
		venta: number;
	}>;
}

export interface ConversionResult {
	montoOriginal: number;
	montoConvertido: number;
	tipoCambio: number;
	fecha: string;
}
