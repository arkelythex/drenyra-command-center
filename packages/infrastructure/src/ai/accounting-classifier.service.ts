/**
 * Accounting Classifier Service
 *
 * Uses LLM to suggest accounting entries based on expense descriptions.
 * Follows PCGE (Plan Contable General Empresarial) for Peru.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { modelFlash } from "./models";

/**
 * Classification input
 * @example
 * ```ts
 * const value: ClassificationInput = {} as ClassificationInput;
 * console.log(value);
 * ```
 */

export interface ClassificationInput {
	itemDescription: string;
	amount: number;
	businessType?: string;
	providerName?: string;
	category?: string;
}

/**
 * Classification result
 * @example
 * ```ts
 * const value: ClassificationResult = {} as ClassificationResult;
 * console.log(value);
 * ```
 */

export interface ClassificationResult {
	accountCode: string;
	accountName: string;
	category: "EXPENSE" | "ASSET" | "COST_OF_GOODS_SOLD" | "OTHER";
	confidence: number;
	reasoning: string;
	suggestedDebitAccount?: string;
	suggestedCreditAccount?: string;
}

/**
 * Schema for structured output
 */
const ClassificationSchema = z.object({
	accountCode: z.string().describe("Código de cuenta PCGE (ej: 6011, 6311)"),
	accountName: z.string().describe("Nombre de la cuenta contable"),
	category: z.enum(["EXPENSE", "ASSET", "COST_OF_GOODS_SOLD", "OTHER"]),
	confidence: z.number().min(0).max(1).describe("Nivel de confianza 0-1"),
	reasoning: z.string().describe("Breve explicación de la clasificación"),
	suggestedDebitAccount: z
		.string()
		.optional()
		.describe("Cuenta de cargo sugerida"),
	suggestedCreditAccount: z
		.string()
		.optional()
		.describe("Cuenta de abono sugerida"),
});

/**
 * PCGE Account categories for context
 */
const PCGE_CONTEXT = `
Plan Contable General Empresarial (PCGE) - Perú:

CLASE 6 - GASTOS POR NATURALEZA:
- 60 Compras
  - 6011 Mercaderías
  - 6021 Materias primas
- 61 Variación de existencias
- 62 Gastos de personal
  - 6211 Sueldos y salarios
- 63 Gastos de servicios prestados por terceros
  - 6311 Transporte
  - 6313 Alojamiento
  - 6314 Alimentación
  - 6321 Asesoría administrativa
  - 6322 Asesoría legal y tributaria
  - 6323 Auditoría y contable
  - 6341 Mantenimiento de inmuebles
  - 6351 Alquileres
  - 6361 Energía eléctrica
  - 6363 Agua
  - 6364 Teléfono
  - 6365 Internet
- 64 Gastos por tributos
- 65 Otros gastos de gestión
  - 6511 Seguros
  - 6521 Suscripciones
- 66 Pérdida por medición de activos
- 67 Gastos financieros
  - 6711 Préstamos de instituciones financieras
  - 6712 Contratos de arrendamiento financiero

CLASE 3 - ACTIVOS:
- 33 Inmuebles, maquinaria y equipo
  - 3311 Terrenos
  - 3321 Edificaciones
  - 3341 Vehículos motorizados
  - 3351 Muebles
  - 3361 Equipos de cómputo

CLASE 4 - PASIVOS:
- 40 Tributos por pagar
  - 4011 IGV
- 42 Cuentas por pagar comerciales
  - 4212 Emitidas
`;

/**
 * Classify an expense and suggest accounting entry
 * @param input - Input for input.
 * @returns Result of classifyExpense.
 * @example
 * ```ts
 * const result = await classifyExpense({} as ClassificationInput);
 * console.log(result);
 * ```
 */

export async function classifyExpense(
	input: ClassificationInput,
): Promise<ClassificationResult | null> {
	try {
		const systemPrompt = `Eres un contador peruano experto en el Plan Contable General Empresarial (PCGE).

${PCGE_CONTEXT}

Tu tarea es clasificar gastos y sugerir la cuenta contable correcta.
El negocio es del rubro: ${input.businessType || "general"}.

Reglas importantes:
1. Para compras de mercadería para reventa, usa 6011
2. Para servicios de terceros (transporte, alimentación, etc), usa 63xx
3. Para compras de activos fijos, usa 33xx
4. El IGV siempre va a la cuenta 4011
5. Las cuentas por pagar van a 4212

Responde siempre en JSON estructurado.`;

		const userPrompt = `Clasifica este gasto:
- Descripción: ${input.itemDescription}
- Monto: S/ ${input.amount.toFixed(2)}
${input.providerName ? `- Proveedor: ${input.providerName}` : ""}
${input.category ? `- Categoría sugerida: ${input.category}` : ""}

¿Cuál es la cuenta contable correcta según el PCGE?`;

		const result = await generateObject({
			model: modelFlash,
			schema: ClassificationSchema,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.1, // Low temperature for consistency
		});

		return result.object as ClassificationResult;
	} catch (error) {
		console.error("[AccountingClassifier] Error:", error);
		return null;
	}
}

/**
 * Suggest accounting entry for a purchase invoice
 * @param invoice - Input for invoice.
 * @returns Result of suggestPurchaseEntry.
 * @example
 * ```ts
 * const result = await suggestPurchaseEntry({});
 * console.log(result);
 * ```
 */

export async function suggestPurchaseEntry(invoice: {
	providerName: string;
	items: Array<{ description: string; amount: number }>;
	subtotal: number;
	igv: number;
	total: number;
}): Promise<{
	debit: Array<{ accountCode: string; accountName: string; amount: number }>;
	credit: Array<{ accountCode: string; accountName: string; amount: number }>;
} | null> {
	try {
		// Classify main item to determine account
		const mainItem = invoice.items[0];
		const classification = await classifyExpense({
			itemDescription: mainItem?.description || invoice.providerName,
			amount: invoice.subtotal,
			providerName: invoice.providerName,
		});

		if (!classification) {
			return null;
		}

		// Build double-entry
		return {
			debit: [
				{
					accountCode: classification.accountCode,
					accountName: classification.accountName,
					amount: invoice.subtotal,
				},
				{
					accountCode: "4011",
					accountName: "IGV - Cuenta propia",
					amount: invoice.igv,
				},
			],
			credit: [
				{
					accountCode: "4212",
					accountName: "Cuentas por pagar comerciales - Emitidas",
					amount: invoice.total,
				},
			],
		};
	} catch (error) {
		console.error("[AccountingClassifier] Error suggesting entry:", error);
		return null;
	}
}

/**
 * Quick classification without LLM (rule-based fallback)
 * @param description - Input for description.
 * @returns Result of quickClassify.
 * @example
 * ```ts
 * const result = quickClassify("");
 * console.log(result);
 * ```
 */

export function quickClassify(description: string): {
	accountCode: string;
	accountName: string;
} {
	const lowerDesc = description.toLowerCase();

	// Transportation
	if (
		lowerDesc.includes("taxi") ||
		lowerDesc.includes("uber") ||
		lowerDesc.includes("transporte")
	) {
		return { accountCode: "6311", accountName: "Transporte de carga" };
	}

	// Food
	if (
		lowerDesc.includes("restaurante") ||
		lowerDesc.includes("almuerzo") ||
		lowerDesc.includes("comida")
	) {
		return { accountCode: "6314", accountName: "Alimentación" };
	}

	// Lodging
	if (lowerDesc.includes("hotel") || lowerDesc.includes("hospedaje")) {
		return { accountCode: "6313", accountName: "Alojamiento" };
	}

	// Utilities
	if (lowerDesc.includes("luz") || lowerDesc.includes("electricidad")) {
		return { accountCode: "6361", accountName: "Energía eléctrica" };
	}
	if (lowerDesc.includes("agua")) {
		return { accountCode: "6363", accountName: "Agua" };
	}
	if (
		lowerDesc.includes("teléfono") ||
		lowerDesc.includes("telefono") ||
		lowerDesc.includes("celular")
	) {
		return { accountCode: "6364", accountName: "Teléfono" };
	}
	if (lowerDesc.includes("internet")) {
		return { accountCode: "6365", accountName: "Internet" };
	}

	// Office
	if (
		lowerDesc.includes("útiles") ||
		lowerDesc.includes("oficina") ||
		lowerDesc.includes("papelería")
	) {
		return { accountCode: "6561", accountName: "Suministros" };
	}

	// Services
	if (lowerDesc.includes("contab") || lowerDesc.includes("auditor")) {
		return { accountCode: "6323", accountName: "Auditoría y contable" };
	}
	if (lowerDesc.includes("legal") || lowerDesc.includes("abogado")) {
		return { accountCode: "6322", accountName: "Legal y tributaria" };
	}

	// Default: Other management expenses
	return { accountCode: "6599", accountName: "Otros gastos de gestión" };
}
