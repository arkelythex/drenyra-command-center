/**
 * Data Transfer Objects for Journal Entry operations
 * These DTOs are used to transfer data between layers
 */

import { z } from "zod";

// ============================================================================
// CREATE JOURNAL ENTRY
// ============================================================================

/**
 * CreateJournalLineSchema const.
 *
 * @example
 * ```ts
 * console.log(CreateJournalLineSchema);
 * ```
 */
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

/**
 * CreateJournalEntrySchema const.
 *
 * @example
 * ```ts
 * console.log(CreateJournalEntrySchema);
 * ```
 */
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

/**
 * CreateJournalLineDTO type.
 *
 * @example
 * ```ts
 * const value: CreateJournalLineDTO = {} as CreateJournalLineDTO;
 * console.log(value);
 * ```
 */
export type CreateJournalLineDTO = z.infer<typeof CreateJournalLineSchema>;
/**
 * CreateJournalEntryDTO type.
 *
 * @example
 * ```ts
 * const value: CreateJournalEntryDTO = {} as CreateJournalEntryDTO;
 * console.log(value);
 * ```
 */
export type CreateJournalEntryDTO = z.infer<typeof CreateJournalEntrySchema>;

// ============================================================================
// UPDATE JOURNAL ENTRY
// ============================================================================

/**
 * UpdateJournalEntrySchema const.
 *
 * @example
 * ```ts
 * console.log(UpdateJournalEntrySchema);
 * ```
 */
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

/**
 * UpdateJournalEntryDTO type.
 *
 * @example
 * ```ts
 * const value: UpdateJournalEntryDTO = {} as UpdateJournalEntryDTO;
 * console.log(value);
 * ```
 */
export type UpdateJournalEntryDTO = z.infer<typeof UpdateJournalEntrySchema>;

// ============================================================================
// JOURNAL ENTRY FILTERS
// ============================================================================

/**
 * JournalEntryFiltersSchema const.
 *
 * @example
 * ```ts
 * console.log(JournalEntryFiltersSchema);
 * ```
 */
export const JournalEntryFiltersSchema = z.object({
	organizationId: z.number().int().positive(),
	status: z.enum(["borrador", "mayorizado", "declarado", "all"]).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
	minAmount: z.number().min(0).optional(),
	maxAmount: z.number().min(0).optional(),
	documentNumber: z.string().optional(),
});

/**
 * JournalEntryFiltersDTO type.
 *
 * @example
 * ```ts
 * const value: JournalEntryFiltersDTO = {} as JournalEntryFiltersDTO;
 * console.log(value);
 * ```
 */
export type JournalEntryFiltersDTO = z.infer<typeof JournalEntryFiltersSchema>;

// ============================================================================
// RESPONSE DTOs (for presentation layer)
// ============================================================================

/**
 * JournalLineResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: JournalLineResponseDTO = {} as JournalLineResponseDTO;
 * console.log(value);
 * ```
 */
export interface JournalLineResponseDTO {
	id: string;
	accountId: string;
	accountCode: string;
	accountName: string;
	description: string;
	debit: number;
	credit: number;
	documentType?: string;
	documentNumber?: string;
	dueDate?: string;
}

/**
 * JournalEntryResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: JournalEntryResponseDTO = {} as JournalEntryResponseDTO;
 * console.log(value);
 * ```
 */
export interface JournalEntryResponseDTO {
	id: string;
	organizationId: number;
	entryNumber: string;
	date: string;
	gloss: string;
	status: "borrador" | "mayorizado" | "declarado";
	totalDebit: number;
	totalCredit: number;
	lines: JournalLineResponseDTO[];
	postedBy?: string;
	postedAt?: string;
	createdAt: string;
	updatedAt: string;
}
