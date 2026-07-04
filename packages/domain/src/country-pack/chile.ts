/**
 * Chile Country Pack — SII configuration for Chile.
 *
 * RUT (Rol Único Tributario) is the Chilean tax ID.
 * DTE (Documento Tributario Electrónico) is the electronic invoice.
 * IVA is 19% standard rate.
 */

import type { CountryPack } from "./types";

export const chileCountryPack: CountryPack = {
	code: "CL",
	name: "Chile",
	taxAuthorityName: "SII",
	defaultCurrency: "CLP",
	locale: "es-CL",
	timezone: "America/Santiago",
	taxIdentifierTypes: ["RUT"],
};
