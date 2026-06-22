/**
 * Prometeo API Service
 *
 * Cliente HTTP para Prometeo API (agregador bancario).
 * Implementa login, accounts, movements y logout.
 *
 * Documentación: https://docs.prometeoapi.com
 *
 * IMPORTANTE:
 * - Session keys expiran en 5 minutos
 * - NUNCA almacenar credenciales bancarias
 * - Usar en memoria o Redis con TTL corto
 *
 * @module banking-providers/infrastructure
 */

import type {
  BankProvider,
  BankCredentials,
  BankAccount,
  BankMovement,
  AccountHolder,
  PrometeoError,
} from '../domain/types';

interface PrometeoConfig {
  baseUrl: string;
  apiKey: string;
}

function getPrometeoConfig(): PrometeoConfig {
  const environment = (process.env.PROMETEO_ENV ?? 'sandbox').toLowerCase();
  const configuredBaseUrl = process.env.PROMETEO_BASE_URL?.trim();
  const defaultBaseUrl =
    environment === 'production'
      ? 'https://banking.prometeoapi.com'
      : 'https://banking.sandbox.prometeoapi.com';

  return {
    baseUrl: configuredBaseUrl || defaultBaseUrl,
    apiKey: process.env.PROMETEO_API_KEY || '',
  };
}

/**
 * Prometeo Login Response
 */
interface PrometeoLoginResponse {
  status: string;
  key: string; // Session key (expira en 5 min)
  message?: string;
}

/**
 * Prometeo Accounts Response
 */
interface PrometeoAccountsResponse {
  status: string;
  accounts: Array<{
    id: string;
    name: string;
    number: string;
    branch: string;
    currency: 'PEN' | 'USD' | 'EUR';
    balance: number;
  }>;
}

/**
 * Prometeo Movements Response
 */
interface PrometeoMovementsResponse {
  status: string;
  movements: Array<{
    id: string;
    date: string;
    description: string;
    reference: string;
    debit: number | null;
    credit: number | null;
    balance: number;
  }>;
}

/**
 * Prometeo Personal Info Response
 */
interface PrometeoPersonalInfoResponse {
  status: string;
  name: string;
  document_type: string;
  document_number: string;
}

/**
 * Prometeo API Client
 * @example
 * ```ts
 * const value = new PrometeoService();
 * console.log(value);
 * ```
 */

export class PrometeoService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    const config = getPrometeoConfig();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;

    if (!this.apiKey) {
      throw new Error(
        'PROMETEO_API_KEY is required. Get it from https://prometeoapi.com dashboard'
      );
    }
  }

  /**
   * Login to bank via Prometeo
   *
   * Returns session key (expires in 5 minutes)
   *
   * @throws PrometeoError if login fails
   */
  async login(credentials: BankCredentials): Promise<string> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        provider: credentials.provider,
        username: credentials.username,
        password: credentials.password,
        ...(credentials.documentType && { type: credentials.documentType }),
        ...(credentials.documentNumber && { document_number: credentials.documentNumber }),
        ...(credentials.otpToken && { otp_token: credentials.otpToken }),
      }),
    });

    if (!response.ok) {
      throw new Error(await this.extractHttpError(response, 'Prometeo login failed'));
    }

    const data: PrometeoLoginResponse = await response.json();

    if (data.status !== 'success' || !data.key) {
      throw new Error(data.message || 'Login failed: no session key received');
    }

    return data.key; // Session key (5 min TTL)
  }

  /**
   * Get accounts from bank
   *
   * @param sessionKey - Session key from login (expires in 5 min)
   * @param provider - Bank provider
   */
  async getAccounts(sessionKey: string, provider: BankProvider): Promise<BankAccount[]> {
    const response = await fetch(`${this.baseUrl}/account`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        key: sessionKey,
      },
    });

    if (!response.ok) {
      throw new Error(await this.extractHttpError(response, 'Failed to fetch accounts'));
    }

    const data: PrometeoAccountsResponse = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch accounts');
    }

    // Normalize to ARKELYTHEX schema
    return data.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      number: account.number,
      branch: account.branch,
      currency: account.currency,
      balance: account.balance,
      type: this.inferAccountType(account.name),
      provider,
    }));
  }

  /**
   * Get movements/transactions from account
   *
   * @param sessionKey - Session key from login
   * @param provider - Bank provider
   * @param accountId - Account ID (from getAccounts)
   * @param dateStart - Start date (YYYY-MM-DD)
   * @param dateEnd - End date (YYYY-MM-DD)
   */
  async getMovements(
    sessionKey: string,
    provider: BankProvider,
    accountId: string,
    dateStart?: string,
    dateEnd?: string
  ): Promise<BankMovement[]> {
    const params = new URLSearchParams({
      account: accountId,
      ...(dateStart && { date_start: dateStart }),
      ...(dateEnd && { date_end: dateEnd }),
    });

    const response = await fetch(`${this.baseUrl}/movements?${params}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        key: sessionKey,
      },
    });

    if (!response.ok) {
      throw new Error(await this.extractHttpError(response, 'Failed to fetch movements'));
    }

    const data: PrometeoMovementsResponse = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch movements');
    }

    // Normalize to ARKELYTHEX schema
    return data.movements.map((movement) => ({
      id: movement.id,
      date: movement.date,
      description: movement.description,
      reference: movement.reference,
      debit: movement.debit,
      credit: movement.credit,
      balance: movement.balance,
      currency: 'PEN', // TODO: Inferir del account
      type: movement.debit ? 'DEBIT' : 'CREDIT',
      provider,
    }));
  }

  /**
   * Get personal info of account holder
   *
   * @param sessionKey - Session key from login
   * @param provider - Bank provider
   */
  async getPersonalInfo(sessionKey: string, provider: BankProvider): Promise<AccountHolder> {
    const response = await fetch(`${this.baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        key: sessionKey,
      },
    });

    if (!response.ok) {
      throw new Error(await this.extractHttpError(response, 'Failed to fetch personal info'));
    }

    const data: PrometeoPersonalInfoResponse = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch personal info');
    }

    return {
      name: data.name,
      documentType: data.document_type as 'dni' | 'pasaporte' | 'carne_extranjeria',
      documentNumber: data.document_number,
      provider,
    };
  }

  /**
   * Logout from Prometeo session
   *
   * @param sessionKey - Session key to invalidate
   */
  async logout(sessionKey: string): Promise<void> {
    await fetch(`${this.baseUrl}/logout`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        key: sessionKey,
      },
    });
    // Ignore errors on logout
  }

  /**
   * Infer account type from name (heuristic)
   *
   * TODO: Mejorar con reglas por banco
   */
  private inferAccountType(accountName: string): 'CHECKING' | 'SAVINGS' | 'CREDIT' {
    const lowerName = accountName.toLowerCase();

    if (lowerName.includes('ahorro') || lowerName.includes('saving')) {
      return 'SAVINGS';
    }

    if (
      lowerName.includes('credito') ||
      lowerName.includes('tarjeta') ||
      lowerName.includes('credit')
    ) {
      return 'CREDIT';
    }

    return 'CHECKING'; // Default
  }

  private async extractHttpError(response: Response, fallback: string): Promise<string> {
    try {
      const error = (await response.json()) as PrometeoError;
      if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
      }
      return `${fallback} (HTTP ${response.status})`;
    } catch {
      return `${fallback} (HTTP ${response.status})`;
    }
  }
}
