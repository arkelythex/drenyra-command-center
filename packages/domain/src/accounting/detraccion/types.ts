import type { Currency } from "../../types/currency";
import type { Money } from "../../value-objects/Money";

export type DetraccionStatus =
	| "pendiente"
	| "depositado"
	| "usado"
	| "liberado";

export const SPOT_CODE_REGISTRY: Record<
	string,
	{ code: string; description: string; percentage: number }
> = {
	"001": { code: "001", description: "Azúcar y melaza de caña", percentage: 10 },
	"003": { code: "003", description: "Alcohol etílico", percentage: 10 },
	"004": { code: "004", description: "Recursos hidrobiológicos", percentage: 4 },
	"005": { code: "005", description: "Maíz amarillo duro", percentage: 4 },
	"007": { code: "007", description: "Caña de azúcar", percentage: 10 },
	"008": { code: "008", description: "Madera", percentage: 4 },
	"009": { code: "009", description: "Arena y piedra", percentage: 10 },
	"010": { code: "010", description: "Residuos, subproductos, desechos y formas primarias", percentage: 15 },
	"011": { code: "011", description: "Bienes gravados con IGV por renuncia a exoneración", percentage: 10 },
	"012": { code: "012", description: "Intermediación laboral y tercerización", percentage: 12 },
	"013": { code: "013", description: "Animales vivos", percentage: 10 },
	"014": { code: "014", description: "Carnes y despojos comestibles", percentage: 4 },
	"015": { code: "015", description: "Abonos, cueros y pieles de origen animal", percentage: 10 },
	"016": { code: "016", description: "Aceite de pescado", percentage: 10 },
	"017": { code: "017", description: "Harina, polvo de pescado y crustáceos", percentage: 4 },
	"019": { code: "019", description: "Arrendamiento de bienes", percentage: 10 },
	"020": { code: "020", description: "Mantenimiento y reparación de bienes muebles", percentage: 12 },
	"021": { code: "021", description: "Movimiento de carga", percentage: 10 },
	"022": { code: "022", description: "Otros servicios empresariales", percentage: 12 },
	"023": { code: "023", description: "Leche cruda entera", percentage: 4 },
	"024": { code: "024", description: "Comisión mercantil", percentage: 10 },
	"025": { code: "025", description: "Fabricación de bienes por encargo", percentage: 10 },
	"026": { code: "026", description: "Servicio de transporte de personas", percentage: 10 },
	"030": { code: "030", description: "Contratos de construcción", percentage: 4 },
	"031": { code: "031", description: "Oro gravado con el IGV", percentage: 10 },
	"032": { code: "032", description: "Páprika y otros frutos capsicum", percentage: 10 },
	"034": { code: "034", description: "Minerales metálicos no auríferos", percentage: 10 },
	"035": { code: "035", description: "Bienes exonerados del IGV", percentage: 1.5 },
	"036": { code: "036", description: "Oro y minerales metálicos exonerados del IGV", percentage: 1.5 },
	"037": { code: "037", description: "Demás servicios gravados con el IGV", percentage: 12 },
	"039": { code: "039", description: "Minerales no metálicos", percentage: 10 },
} as const;

export type SpotCode = keyof typeof SPOT_CODE_REGISTRY;

export type SerializedMoney = {
	amount: ReturnType<Money["toNumber"]>;
	currency: Currency;
};
