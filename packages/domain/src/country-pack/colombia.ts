/**
 * Colombia Country Pack — DIAN configuration for Colombia.
 *
 * NIT (Número de Identificación Tributaria) is the Colombian tax ID.
 * Factura Electrónica is mandatory since 2020.
 * IVA is 19% standard rate.
 */

import type { CountryPack } from "./types";

export const colombiaCountryPack: CountryPack = {
	code: "CO",
	name: "Colombia",
	taxAuthorityName: "DIAN",
	defaultCurrency: "COP",
	locale: "es-CO",
	timezone: "America/Bogota",
	taxIdentifierTypes: ["NIT"],
};
