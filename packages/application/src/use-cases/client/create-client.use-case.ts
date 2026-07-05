/**
 * Create Client Use Case
 *
 * Business logic for creating a new client
 * Following Clean Architecture - Application Layer
 */

import type {
	Client,
	ClientRepository,
} from "@drenyra/domain/repositories/client.repository";

/**
 * CreateClientInput interface.
 *
 * @example
 * ```ts
 * const value: CreateClientInput = {} as CreateClientInput;
 * console.log(value);
 * ```
 */
export interface CreateClientInput {
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
 * CreateClientOutput interface.
 *
 * @example
 * ```ts
 * const value: CreateClientOutput = {} as CreateClientOutput;
 * console.log(value);
 * ```
 */
export interface CreateClientOutput {
	success: boolean;
	client?: Client;
	error?: string;
}

/**
 * CreateClientUseCase class.
 *
 * @example
 * ```ts
 * const value = new CreateClientUseCase();
 * console.log(value);
 * ```
 */
export class CreateClientUseCase {
	constructor(private clientRepository: ClientRepository) {}

	async execute(input: CreateClientInput): Promise<CreateClientOutput> {
		try {
			// Validate document number format
			if (
				!this.validateDocumentNumber(input.documentType, input.documentNumber)
			) {
				return {
					success: false,
					error: `Formato de ${input.documentType} inválido`,
				};
			}

			// Check if client with same document number already exists
			const existing = await this.clientRepository.findByDocumentNumber(
				input.organizationId,
				input.documentNumber,
			);

			if (existing) {
				return {
					success: false,
					error: `Ya existe un cliente con ${input.documentType}: ${input.documentNumber}`,
				};
			}

			// Create client
			const client = await this.clientRepository.save(input);

			return {
				success: true,
				client,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Error al crear cliente",
			};
		}
	}

	/**
	 * Validate document number format
	 */
	private validateDocumentNumber(
		documentType: string,
		documentNumber: string,
	): boolean {
		switch (documentType) {
			case "RUC":
				// RUC: 11 digits
				return /^\d{11}$/.test(documentNumber);
			case "DNI":
				// DNI: 8 digits
				return /^\d{8}$/.test(documentNumber);
			case "CE":
				// CE: 9 alphanumeric characters
				return /^[A-Z0-9]{9}$/.test(documentNumber);
			default:
				return false;
		}
	}
}
