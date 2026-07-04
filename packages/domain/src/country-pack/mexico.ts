/**
 * Mexico Country Pack — SAT configuration for Mexico.
 *
 * RFC (Registro Federal de Contribuyentes) is the Mexican tax ID.
 * CFDI 4.0 (Comprobante Fiscal Digital por Internet) is the electronic invoice.
 * IVA (Impuesto al Valor Agregado) is 16% standard rate.
 *
 * @module country-pack/mexico
 */

import type { CountryPack } from "./types";

export const mexicoCountryPack: CountryPack = {
	code: "MX",
	name: "México",
	taxAuthorityName: "SAT",
	defaultCurrency: "MXN",
	locale: "es-MX",
	timezone: "America/Mexico_City",
	taxIdentifierTypes: ["RFC"],
};
