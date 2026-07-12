import { z } from "zod";
export const CreateJournalLineSchema = z
	.object({
		accountId: z.string().uuid("ID de cuenta inválido"),
		description: z.string().min(1, "La descripción es requerida"),
		debit: z.number().min(0, "El debe no puede ser negativo").default(0),
		credit: z.number().min(0, "El haber no puede ser negativo").default(0),
		documentType: z.string().optional(),
		documentNumber: z.string().optional(),
		dueDate: z.date().optional(),
	})
	.refine(
		(data) =>
			(data.debit > 0 && data.credit === 0) ||
			(data.credit > 0 && data.debit === 0),
		{ message: "Una línea debe tener Debe o Haber, pero no ambos" },
	);
export const CreateJournalEntrySchema = z
	.object({
		organizationId: z.number().int().positive("ID de organización inválido"),
		date: z.date(),
		gloss: z
			.string()
			.min(1, "La glosa es requerida")
			.max(500, "La glosa es muy larga"),
		lines: z
			.array(CreateJournalLineSchema)
			.min(2, "El asiento debe tener al menos 2 líneas"),
	})
	.refine(
		(data) => {
			const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
			const totalCredit = data.lines.reduce(
				(sum, line) => sum + line.credit,
				0,
			);
			return Math.abs(totalDebit - totalCredit) < 0.01;
		},
		{ message: "El asiento debe estar balanceado (Debe = Haber)" },
	);
export const UpdateJournalEntrySchema = z
	.object({
		date: z.date().optional(),
		gloss: z.string().min(1).max(500).optional(),
		lines: z.array(CreateJournalLineSchema).min(2).optional(),
	})
	.refine(
		(data) => {
			if (!data.lines) return true;
			const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
			const totalCredit = data.lines.reduce(
				(sum, line) => sum + line.credit,
				0,
			);
			return Math.abs(totalDebit - totalCredit) < 0.01;
		},
		{ message: "El asiento debe estar balanceado (Debe = Haber)" },
	);
export const JournalEntryFiltersSchema = z.object({
	organizationId: z.number().int().positive(),
	status: z.enum(["borrador", "mayorizado", "declarado", "all"]).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
	minAmount: z.number().min(0).optional(),
	maxAmount: z.number().min(0).optional(),
	documentNumber: z.string().optional(),
});
//# sourceMappingURL=journal-entry.dto.js.map
