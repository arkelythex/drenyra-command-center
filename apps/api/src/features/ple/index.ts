/**
 * PLE Feature Module — Programa de Libros Electrónicos
 *
 * SUNAT-mandated digital bookkeeping for Peruvian taxpayers.
 * Covers LE-DIARIO, LE-MAYOR, LE-COMPRAS, and LE-VENTAS
 * in SUNAT's pipe-delimited TXT format with CDR hash.
 */
import { Elysia } from "elysia";
import { pleRoutes } from "./ple.routes";

// ─── Types ─────────────────────────────────────────────────────────

export type {
	PleBookType,
	PleGenerationStatus,
	PleGenerationResult,
	GeneratePleBookInput,
	PleValidationResult,
	PleValidationError,
	PleValidationWarning,
	PleFileName,
	ListPleBooksParams,
} from "./ple.types";

// ─── Services ──────────────────────────────────────────────────────

export { PleService } from "./ple.service";
export { PleGeneratorService } from "./ple-generator.service";
export { PleValidator } from "./ple-validator.service";

// ─── Elysia Module ─────────────────────────────────────────────────

/**
 * PLE Elysia module — mounts all PLE endpoints under `/api/ple`.
 *
 * @example
 * ```ts
 * import { pleModule } from "./features/ple";
 * app.use(pleModule);
 * ```
 */
export const pleModule = new Elysia().use(pleRoutes);
