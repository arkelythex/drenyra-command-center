/**
 * Provider Repository Interface
 *
 * Defines the contract for provider (supplier) data persistence operations
 * Following Clean Architecture principles
 * Provider (supplier) aggregate snapshot used by repository operations.
 *
 * @example
 * ```ts
 * const provider: Provider = {
 *   id: "prov_123",
 *   organizationId: 1,
 *   name: "ACME S.A.C.",
 *   ruc: "20123456789",
 *   paymentTerms: 30,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */

export interface Provider {
	id: string;
	organizationId: number;
	name: string;
	ruc: string;
	email?: string;
	phone?: string;
	address?: string;
	paymentTerms: number; // days
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Filter options for listing/counting providers.
 *
 * @example
 * ```ts
 * const filters: ProviderFilters = { name: "ACME" };
 * ```
 */
export interface ProviderFilters {
	name?: string;
	ruc?: string;
	email?: string;
}

/**
 * Input required to create a provider.
 *
 * @example
 * ```ts
 * const dto: CreateProviderDTO = {
 *   organizationId: 1,
 *   name: "ACME S.A.C.",
 *   ruc: "20123456789",
 *   paymentTerms: 30,
 * };
 * ```
 */
export interface CreateProviderDTO {
	organizationId: number;
	name: string;
	ruc: string;
	email?: string;
	phone?: string;
	address?: string;
	paymentTerms?: number;
}

/**
 * Allowed fields for provider updates.
 *
 * @example
 * ```ts
 * const patch: UpdateProviderDTO = { email: "billing@acme.com" };
 * ```
 */
export interface UpdateProviderDTO {
	name?: string;
	ruc?: string;
	email?: string;
	phone?: string;
	address?: string;
	paymentTerms?: number;
}

/**
 * Repository contract for provider persistence.
 *
 * @example
 * ```ts
 * const repo: ProviderRepository = getProviderRepository();
 * const providers = await repo.findAll(1, { name: "ACME" });
 * ```
 */
export interface ProviderRepository {
	save(data: CreateProviderDTO): Promise<Provider>;
	update(id: string, data: UpdateProviderDTO): Promise<Provider>;
	delete(id: string): Promise<void>;

	/**
	 * Find a provider by ID within the given tenant scope.
	 * Enforces tenant isolation by filtering on companyId from the scope.
	 */
	findById(scope: import("../scope").TenantScope, id: string): Promise<Provider | null>;
	findAll(
		organizationId: number,
		filters?: ProviderFilters,
	): Promise<Provider[]>;
	count(organizationId: number, filters?: ProviderFilters): Promise<number>;
	findByRUC(organizationId: number, ruc: string): Promise<Provider | null>;
}
