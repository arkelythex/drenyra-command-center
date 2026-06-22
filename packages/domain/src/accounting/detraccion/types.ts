import type { Currency } from "../../types/currency";
import type { Money } from "../../value-objects/Money";

export type DetraccionStatus =
	| "pendiente"
	| "depositado"
	| "usado"
	| "liberado";

export const SPOT_CODE_REGISTRY: Record<
	string,
	{ code: string; description: string }
> = {
	"001": { code: "001", description: "Transporte de bienes por vía terrestre" },
	"002": { code: "002", description: "Transporte público de pasajeros" },
	"003": { code: "003", description: "Alquiler de bienes muebles" },
	"004": {
		code: "004",
		description: "Mantenimiento y reparación de bienes muebles",
	},
	"005": { code: "005", description: "Intermediación laboral y tercerización" },
	"006": { code: "006", description: "Arrendamiento de bienes inmuebles" },
	"007": { code: "007", description: "Otros servicios empresariales" },
} as const;

export type SpotCode = keyof typeof SPOT_CODE_REGISTRY;

export type SerializedMoney = {
	amount: ReturnType<Money["toNumber"]>;
	currency: Currency;
};
