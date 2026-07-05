import { z } from "zod";
export const ClassificationSchema = z.object({
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
//# sourceMappingURL=types.js.map
