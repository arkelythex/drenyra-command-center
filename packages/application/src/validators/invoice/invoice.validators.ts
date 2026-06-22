import { z } from "zod";

/**
 * CreateInvoiceItemSchema const.
 *
 * @example
 * ```ts
 * console.log(CreateInvoiceItemSchema);
 * ```
 */
export const CreateInvoiceItemSchema = z.object({
	description: z.string().min(1, "Descripción requerida").max(500),
	quantity: z.number().positive("Cantidad debe ser positiva"),
	unitPrice: z.number().positive("Precio unitario debe ser positivo"),
});

/**
 * CreateInvoiceSchema const.
 *
 * @example
 * ```ts
 * console.log(CreateInvoiceSchema);
 * ```
 */
export const CreateInvoiceSchema = z
	.object({
		organizationId: z.number().int().positive().optional(),
		series: z.string().regex(/^[FB]\d{3}$/, "Serie debe ser F001, B001, etc."),
		number: z.number().int().positive(),
		issueDate: z.date(),
		dueDate: z.date().optional(),
		clientName: z.string().min(1).max(200),
		clientRUC: z
			.string()
			.regex(/^\d{11}$/, "RUC debe tener 11 dígitos")
			.optional(),
		clientDNI: z
			.string()
			.regex(/^\d{8}$/, "DNI debe tener 8 dígitos")
			.optional(),
		clientAddress: z.string().max(500).optional(),
		currency: z.enum(["PEN", "USD"]),
		items: z
			.array(CreateInvoiceItemSchema)
			.min(1, "Debe tener al menos un item"),
	})
	.refine((data) => data.clientRUC || data.clientDNI, {
		message: "Debe proporcionar RUC o DNI del cliente",
		path: ["clientRUC"],
	});

/**
 * CreateInvoiceInput type.
 *
 * @example
 * ```ts
 * const value: CreateInvoiceInput = {} as CreateInvoiceInput;
 * console.log(value);
 * ```
 */
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
/**
 * CreateInvoiceItemInput type.
 *
 * @example
 * ```ts
 * const value: CreateInvoiceItemInput = {} as CreateInvoiceItemInput;
 * console.log(value);
 * ```
 */
export type CreateInvoiceItemInput = z.infer<typeof CreateInvoiceItemSchema>;

/**
 * UpdateInvoiceSchema const.
 *
 * @example
 * ```ts
 * console.log(UpdateInvoiceSchema);
 * ```
 */
export const UpdateInvoiceSchema = z.object({
	id: z.string().uuid(),
	organizationId: z.number().int().positive().optional(),
	series: z
		.string()
		.regex(/^[FB]\d{3}$/)
		.optional(),
	number: z.number().int().positive().optional(),
	dueDate: z.date().optional(),
	clientName: z.string().min(1).max(200).optional(),
	clientRUC: z
		.string()
		.regex(/^\d{11}$/)
		.optional(),
	clientDNI: z
		.string()
		.regex(/^\d{8}$/)
		.optional(),
	clientAddress: z.string().max(500).optional(),
	status: z
		.enum(["DRAFT", "PENDING", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"])
		.optional(),
	notes: z.string().max(1000).optional(),
	items: z.array(CreateInvoiceItemSchema).optional(),
});

/**
 * UpdateInvoiceInput type.
 *
 * @example
 * ```ts
 * const value: UpdateInvoiceInput = {} as UpdateInvoiceInput;
 * console.log(value);
 * ```
 */
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

/**
 * DeleteInvoiceSchema const.
 *
 * @example
 * ```ts
 * console.log(DeleteInvoiceSchema);
 * ```
 */
export const DeleteInvoiceSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().min(1).max(500).optional(),
});

/**
 * DeleteInvoiceInput type.
 *
 * @example
 * ```ts
 * const value: DeleteInvoiceInput = {} as DeleteInvoiceInput;
 * console.log(value);
 * ```
 */
export type DeleteInvoiceInput = z.infer<typeof DeleteInvoiceSchema>;
