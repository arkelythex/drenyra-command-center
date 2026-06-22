import { z } from "zod";

/**
 * Document status enum.
 */
export const DocumentStatusEnum = z.enum([
	"por_procesar",
	"procesando",
	"revision_humana",
	"listo_para_sire",
	"rechazado_por_sire",
	"aprobado",
	"error",
]);

/**
 * Document type enum.
 */
export const DocumentTypeEnum = z.enum([
	"invoice",
	"receipt",
	"contract",
	"other",
]);
