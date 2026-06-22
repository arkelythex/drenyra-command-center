import type { DetraccionRate, PercepcionRate } from "./types";

const DETRACCION_RATES: Record<string, DetraccionRate> = {
	"001": {
		code: "001",
		description: "Transporte de bienes por vía terrestre",
		rate: 0.04,
	},
	"002": {
		code: "002",
		description: "Transporte público de pasajeros",
		rate: 0.04,
	},
	"003": {
		code: "003",
		description: "Alquiler de bienes muebles",
		rate: 0.04,
	},
	"004": {
		code: "004",
		description: "Mantenimiento y reparación de bienes muebles",
		rate: 0.04,
	},
	"005": {
		code: "005",
		description: "Intermediación laboral y tercerización",
		rate: 0.12,
	},
	"006": {
		code: "006",
		description: "Arrendamiento de bienes inmuebles",
		rate: 0.05,
	},
	"007": {
		code: "007",
		description: "Otros servicios empresariales",
		rate: 0.1,
	},
};

const PERCEPCION_RATES: Record<string, PercepcionRate> = {
	VENTA_INTERNA: {
		code: "VENTA_INTERNA",
		description: "Venta interna — Régimen de Percepciones",
		rate: 0.02,
	},
	IMPORTACION: {
		code: "IMPORTACION",
		description: "Importación — Percepción aduanera",
		rate: 0.035,
	},
	COMBUSTIBLE: {
		code: "COMBUSTIBLE",
		description: "Combustibles — Ley 28683",
		rate: 0.01,
	},
};

export function getDetraccionRates(): DetraccionRate[] {
	return Object.values(DETRACCION_RATES);
}

export function getDetraccionRate(code: string): DetraccionRate | undefined {
	return DETRACCION_RATES[code];
}

export function getPercepcionRates(): PercepcionRate[] {
	return Object.values(PERCEPCION_RATES);
}

export function getPercepcionRate(
	percepcionType: string,
): PercepcionRate | undefined {
	return PERCEPCION_RATES[percepcionType];
}

export { DETRACCION_RATES, PERCEPCION_RATES };
