/**
 * Client Repository Interface
 *
 * Defines the contract for client data persistence operations
 * following Clean Architecture principles
 * Client aggregate snapshot used by repository operations.
 *
 * @example
 * ```ts
 * const client: Client = {
 *   id: "cli_123",
 *   organizationId: 1,
 *   name: "Juan Pérez",
 *   documentType: "DNI",
 *   documentNumber: "12345678",
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */

export interface Client {
	id: string;
	organizationId: number;
	name: string;
	documentType: "RUC" | "DNI" | "CE";
	documentNumber: string;
	email?: string;
	phone?: string;
	address?: string;
	creditLimit?: string; // decimal as string
	creditDays?: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Filter options for listing/counting clients.
 *
 * @example
 * ```ts
 * const filters: ClientFilters = { name: "Juan", documentType: "DNI" };
 * ```
 */
export interface ClientFilters {
	name?: string;
	documentType?: "RUC" | "DNI" | "CE";
	documentNumber?: string;
	email?: string;
}

/**
 * Input required to create a client.
 *
 * @example
 * ```ts
 * const dto: CreateClientDTO = {
 *   organizationId: 1,
 *   name: "Juan Pérez",
 *   documentType: "DNI",
 *   documentNumber: "12345678",
 * };
 * ```
 */
export interface CreateClientDTO {
	organizationId: number;
	name: string;
	documentType: "RUC" | "DNI" | "CE";
	documentNumber: string;
	email?: string;
	phone?: string;
	address?: string;
	creditLimit?: string;
	creditDays?: number;
}

/**
 * Allowed fields for client updates.
 *
 * @example
 * ```ts
 * const patch: UpdateClientDTO = { email: "juan@example.com" };
 * ```
 */
export interface UpdateClientDTO {
	name?: string;
	documentType?: "RUC" | "DNI" | "CE";
	documentNumber?: string;
	email?: string;
	phone?: string;
	address?: string;
	creditLimit?: string;
	creditDays?: number;
}

/**
 * Repository contract for client persistence.
 *
 * @example
 * ```ts
 * const repo: ClientRepository = getClientRepository();
 * const clients = await repo.findAll(1, { documentType: "RUC" });
 * ```
 */
export interface ClientRepository {
	save(data: CreateClientDTO): Promise<Client>;
	update(id: string, data: UpdateClientDTO): Promise<Client>;
	delete(id: string): Promise<void>;

	/**
	 * Find a client by ID within the given tenant scope.
	 * Enforces tenant isolation by filtering on companyId from the scope.
	 */
	findById(scope: import("../scope").TenantScope, id: string): Promise<Client | null>;
	findAll(organizationId: number, filters?: ClientFilters): Promise<Client[]>;
	count(organizationId: number, filters?: ClientFilters): Promise<number>;
	findByDocumentNumber(
		organizationId: number,
		documentNumber: string,
	): Promise<Client | null>;
}
