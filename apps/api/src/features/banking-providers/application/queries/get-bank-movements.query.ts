/**
 * Get Bank Movements Query
 *
 * Obtiene movimientos/transacciones bancarias via Prometeo.
 *
 * @module banking-providers/application/queries
 */

import type { BankProvider, BankMovement } from '../../domain/types';
import { PrometeoService } from '../../infrastructure/prometeo.service';

/**
 * GetBankMovementsInput interface.
 *
 * @example
 * ```ts
 * const value: GetBankMovementsInput = {} as GetBankMovementsInput;
 * console.log(value);
 * ```
 */
export interface GetBankMovementsInput {
  sessionKey: string;
  provider: BankProvider;
  accountId: string;
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string;   // YYYY-MM-DD
}

/**
 * Get Bank Movements Query
 *
 * Retorna lista de movimientos/transacciones de una cuenta
 * @example
 * ```ts
 * const value = new GetBankMovementsQuery();
 * console.log(value);
 * ```
 */

export class GetBankMovementsQuery {
  private prometeoService: PrometeoService;

  constructor() {
    this.prometeoService = new PrometeoService();
  }

  async execute(input: GetBankMovementsInput): Promise<BankMovement[]> {
    return this.prometeoService.getMovements(
      input.sessionKey,
      input.provider,
      input.accountId,
      input.dateStart,
      input.dateEnd
    );
  }
}
