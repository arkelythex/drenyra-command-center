/**
 * List Clients Use Case
 *
 * Business logic for retrieving clients with optional filtering
 * Following Clean Architecture - Application Layer
 */

import type {
	Client,
	ClientFilters,
	ClientRepository,
} from "@arkelythex/domain/repositories/client.repository";

/**
 * ListClientsInput interface.
 *
 * @example
 * ```ts
 * const value: ListClientsInput = {} as ListClientsInput;
 * console.log(value);
 * ```
 */
export interface ListClientsInput {
	organizationId: number;
	filters?: ClientFilters;
	page?: number;
	limit?: number;
}

/**
 * ListClientsOutput interface.
 *
 * @example
 * ```ts
 * const value: ListClientsOutput = {} as ListClientsOutput;
 * console.log(value);
 * ```
 */
export interface ListClientsOutput {
	success: boolean;
	clients?: Client[];
	total?: number;
	page?: number;
	limit?: number;
	error?: string;
}

/**
 * ListClientsUseCase class.
 *
 * @example
 * ```ts
 * const value = new ListClientsUseCase();
 * console.log(value);
 * ```
 */
export class ListClientsUseCase {
	constructor(private clientRepository: ClientRepository) {}

	async execute(input: ListClientsInput): Promise<ListClientsOutput> {
		try {
			const page = input.page || 1;
			const limit = input.limit || 50;

			// Get clients and total count in parallel
			const [clients, total] = await Promise.all([
				this.clientRepository.findAll(input.organizationId, input.filters),
				this.clientRepository.count(input.organizationId, input.filters),
			]);

			// Apply pagination (in-memory for now, ideally should be in repository)
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			const paginatedClients = clients.slice(startIndex, endIndex);

			return {
				success: true,
				clients: paginatedClients,
				total,
				page,
				limit,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Error al listar clientes",
			};
		}
	}
}
