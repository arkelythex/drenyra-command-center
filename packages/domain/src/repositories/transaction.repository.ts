import type {
	Transaction,
	TransactionStatus,
	TransactionType,
} from "../entities/Transaction";

/**
 * Filtros disponibles para la búsqueda de transacciones.
 *
 * @example
 * ```ts
 * const filters: TransactionFilters = {
 *   status: "POSTED" as TransactionStatus,
 *   dateFrom: new Date("2026-01-01"),
 *   dateTo: new Date("2026-01-31"),
 * };
 * ```
 */
export interface TransactionFilters {
	status?: TransactionStatus;
	type?: TransactionType;
	dateFrom?: Date;
	dateTo?: Date;
	referenceNumber?: string;
	minAmount?: number;
	maxAmount?: number;
	accountCode?: string;
}

/**
 * Opciones de paginación para consultas.
 *
 * @example
 * ```ts
 * const pagination: PaginationOptions = { page: 1, limit: 50 };
 * ```
 */
export interface PaginationOptions {
	page: number;
	limit: number;
}

/**
 * Resultado paginado.
 *
 * @example
 * ```ts
 * const page: PaginatedResult<Transaction> = {
 *   data: [],
 *   total: 0,
 *   page: 1,
 *   limit: 50,
 *   totalPages: 0,
 * };
 * ```
 * @typeParam T - Generic type parameter for PaginatedResult.
 */

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Interfaz del Repositorio de Transacciones Contables.
 * Define los métodos necesarios para la persistencia y recuperación de transacciones.
 *
 * Business Rules:
 * - Las transacciones POSTED no pueden ser modificadas, solo anuladas
 * - Las transacciones VOIDED son inmutables
 * - Siempre se debe validar el balance (débitos = créditos)
 *
 * @example
 * ```ts
 * const repo: TransactionRepository = getTransactionRepository();
 * const result = await repo.findAll(1, { status: "POSTED" as TransactionStatus }, { page: 1, limit: 50 });
 * ```
 */
export interface TransactionRepository {
	/**
	 * Guarda una nueva transacción en el repositorio.
	 * @param transaction - La entidad transacción a guardar.
	 * @param organizationId - ID de la organización (multi-tenant).
	 */
	save(transaction: Transaction, organizationId: number): Promise<void>;

	/**
	 * Actualiza una transacción existente.
	 * Solo permitido para transacciones en estado DRAFT.
	 * @param transaction - La entidad transacción con los datos actualizados.
	 * @param organizationId - ID de la organización.
	 */
	update(transaction: Transaction, organizationId: number): Promise<void>;

	/**
	 * Elimina una transacción por su ID.
	 * Solo permitido para transacciones en estado DRAFT.
	 * @param id - El ID de la transacción a eliminar.
	 * @param organizationId - ID de la organización.
	 */
	delete(id: string, organizationId: number): Promise<void>;

	/**
	 * Busca una transacción por su ID dentro del tenant scope.
	 * Enforces tenant isolation by filtering on companyId from the scope.
	 * @param scope - TenantScope con organizationId y companyId.
	 * @param id - El ID de la transacción.
	 * @returns La entidad transacción si existe, o null si no.
	 */
	findById(
		scope: import("../scope").TenantScope,
		id: string,
	): Promise<Transaction | null>;

	/**
	 * @deprecated Use findById(scope, id) instead.
	 */
	_findByIdLegacy(
		id: string,
		organizationId: number,
	): Promise<Transaction | null>;

	/**
	 * Busca una transacción por su número de referencia.
	 * @param referenceNumber - El número de referencia (ej: F001-00001234).
	 * @param organizationId - ID de la organización.
	 */
	findByReferenceNumber(
		referenceNumber: string,
		organizationId: number,
	): Promise<Transaction | null>;

	/**
	 * Busca todas las transacciones que coincidan con los filtros proporcionados.
	 * @param organizationId - ID de la organización.
	 * @param filters - Filtros de búsqueda opcionales.
	 * @param pagination - Opciones de paginación.
	 */
	findAll(
		organizationId: number,
		filters?: TransactionFilters,
		pagination?: PaginationOptions,
	): Promise<PaginatedResult<Transaction>>;

	/**
	 * Busca transacciones por cuenta contable.
	 * Útil para generar libro mayor.
	 * @param accountCode - Código de la cuenta contable.
	 * @param organizationId - ID de la organización.
	 * @param dateFrom - Fecha inicio del período.
	 * @param dateTo - Fecha fin del período.
	 */
	findByAccount(
		accountCode: string,
		organizationId: number,
		dateFrom?: Date,
		dateTo?: Date,
	): Promise<Transaction[]>;

	/**
	 * Cuenta el número total de transacciones que coinciden con los filtros.
	 * @param organizationId - ID de la organización.
	 * @param filters - Filtros de conteo opcionales.
	 */
	count(organizationId: number, filters?: TransactionFilters): Promise<number>;

	/**
	 * Obtiene el siguiente número de referencia disponible.
	 * @param organizationId - ID de la organización.
	 * @param type - Tipo de transacción.
	 * @returns Número de referencia siguiente (ej: "TRX-2025-00001").
	 */
	getNextReferenceNumber(
		organizationId: number,
		type: TransactionType,
	): Promise<string>;
}
