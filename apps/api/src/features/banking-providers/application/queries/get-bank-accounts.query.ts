/**
 * Get Bank Accounts Query
 *
 * Obtiene cuentas bancarias via Prometeo usando session key.
 *
 * @module banking-providers/application/queries
 */

import type { BankProvider, BankAccount } from '../../domain/types';
import { PrometeoService } from '../../infrastructure/prometeo.service';

/**
 * GetBankAccountsInput interface.
 *
 * @example
 * ```ts
 * const value: GetBankAccountsInput = {} as GetBankAccountsInput;
 * console.log(value);
 * ```
 */
export interface GetBankAccountsInput {
  sessionKey: string;
  provider: BankProvider;
}

/**
 * Get Bank Accounts Query
 *
 * Retorna lista de cuentas bancarias del usuario
 * @example
 * ```ts
 * const value = new GetBankAccountsQuery();
 * console.log(value);
 * ```
 */

export class GetBankAccountsQuery {
  private prometeoService: PrometeoService;

  constructor() {
    this.prometeoService = new PrometeoService();
  }

  async execute(input: GetBankAccountsInput): Promise<BankAccount[]> {
    return this.prometeoService.getAccounts(input.sessionKey, input.provider);
  }
}
