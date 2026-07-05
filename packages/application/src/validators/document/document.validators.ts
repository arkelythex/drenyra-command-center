import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const withDocumentTenant = <T extends z.ZodRawShape>(shape: T) =>
	z.object({
		companyId: z.string().uuid("Company ID inválido"),
		...shape,
	});

/**
 * UploadDocumentSchema const.
 *
 * @example
 * ```ts
 * console.log(UploadDocumentSchema);
 * ```
 */
export const UploadDocumentSchema = withDocumentTenant({
	clientId: z.string().uuid("ID de cliente inválido"),
	clientName: z.string().min(1, "Nombre de cliente requerido").max(200),
	file: z.instanceof(File).or(z.instanceof(Buffer)),
	fileName: z.string().min(1).max(255),
	fileType: z.enum(["IMAGE", "XML", "PDF"]),
}).refine(
	(data) => {
		const size = data.file instanceof File ? data.file.size : data.file.length;
		return size <= MAX_FILE_SIZE;
	},
	{
		message: `El archivo no debe exceder ${MAX_FILE_SIZE / 1024 / 1024}MB`,
	},
);

/**
 * UploadDocumentInput type.
 *
 * @example
 * ```ts
 * const value: UploadDocumentInput = {} as UploadDocumentInput;
 * console.log(value);
 * ```
 */
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;

/**
 * ValidateDocumentSchema const.
 *
 * @example
 * ```ts
 * console.log(ValidateDocumentSchema);
 * ```
 */
export const ValidateDocumentSchema = withDocumentTenant({
	documentId: z.string().uuid(),
	validatedBy: z.string().min(1),
	correctedData: z.record(z.string(), z.unknown()).optional(),
	notes: z.string().max(1000).optional(),
});

/**
 * ValidateDocumentInput type.
 *
 * @example
 * ```ts
 * const value: ValidateDocumentInput = {} as ValidateDocumentInput;
 * console.log(value);
 * ```
 */
export type ValidateDocumentInput = z.infer<typeof ValidateDocumentSchema>;

/**
 * RejectDocumentSchema const.
 *
 * @example
 * ```ts
 * console.log(RejectDocumentSchema);
 * ```
 */
export const RejectDocumentSchema = withDocumentTenant({
	documentId: z.string().uuid(),
	rejectedBy: z.string().min(1),
	reason: z.string().min(1, "Razón de rechazo requerida").max(500),
});

/**
 * RejectDocumentInput type.
 *
 * @example
 * ```ts
 * const value: RejectDocumentInput = {} as RejectDocumentInput;
 * console.log(value);
 * ```
 */
export type RejectDocumentInput = z.infer<typeof RejectDocumentSchema>;
