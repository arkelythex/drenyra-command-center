/**
 * Banking Providers Domain Types
 *
 * Tipos para integración con agregadores bancarios (Prometeo API).
 * NO almacena credenciales bancarias, solo session keys temporales.
 *
 * @module banking-providers/domain
 * Providers soportados (Prometeo API)
 * @example
 * ```ts
 * const value: BankProvider = {} as BankProvider;
 * console.log(value);
 * ```
 */

export type BankProvider =
  | 'bcp_pers_pe'      // BCP Personal
  | 'bcp_corp_pe'      // BCP Corporativo (Telecrédito)
  | 'interbank_pe'     // Interbank
  | 'bbva_pers_pe'     // BBVA Personal
  | 'bbva_corp_pe'     // BBVA Corporativo
  | 'scotia_pers_pe'   // Scotiabank Personal
  | 'scotia_smes_pe';  // Scotiabank SMEs

/**
 * Tipo de documento (Perú)
 * @example
 * ```ts
 * const value: DocumentType = {} as DocumentType;
 * console.log(value);
 * ```
 */

export type DocumentType = 'dni' | 'pasaporte' | 'carne_extranjeria';

/**
 * Session key de Prometeo
 *
 * IMPORTANTE: Expira en 5 minutos
 * @example
 * ```ts
 * const value: PrometeoSession = {} as PrometeoSession;
 * console.log(value);
 * ```
 */

export interface PrometeoSession {
  sessionKey: string;
  provider: BankProvider;
  expiresAt: Date; // 5 min desde creación
}

/**
 * Credenciales bancarias (NUNCA almacenar)
 *
 * Solo se usan en memoria durante el login flow
 * @example
 * ```ts
 * const value: BankCredentials = {} as BankCredentials;
 * console.log(value);
 * ```
 */

export interface BankCredentials {
  provider: BankProvider;
  username: string; // Número de tarjeta
  password: string; // Clave de internet (6 dígitos)
  documentType?: DocumentType; // Requerido para BCP Personal
  documentNumber?: string;      // Requerido para BCP Personal
  otpToken?: string;            // OTP para providers que lo requieren
}

/**
 * Cuenta bancaria (schema Prometeo normalizado)
 * @example
 * ```ts
 * const value: BankAccount = {} as BankAccount;
 * console.log(value);
 * ```
 */

export interface BankAccount {
  id: string;           // Account ID del provider
  name: string;         // Nombre de la cuenta
  number: string;       // Número de cuenta
  branch: string;       // Sucursal/agencia
  currency: 'PEN' | 'USD' | 'EUR';
  balance: number;      // Balance actual
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  provider: BankProvider;
}

/**
 * Movimiento/Transacción bancaria
 * @example
 * ```ts
 * const value: BankMovement = {} as BankMovement;
 * console.log(value);
 * ```
 */

export interface BankMovement {
  id: string;
  date: string;         // ISO 8601
  description: string;
  reference: string;    // Número de referencia
  debit: number | null; // Monto débito (null si es crédito)
  credit: number | null; // Monto crédito (null si es débito)
  balance: number;      // Balance después del movimiento
  currency: 'PEN' | 'USD' | 'EUR';
  type: 'CREDIT' | 'DEBIT';
  provider: BankProvider;
}

/**
 * Personal info del titular
 * @example
 * ```ts
 * const value: AccountHolder = {} as AccountHolder;
 * console.log(value);
 * ```
 */

export interface AccountHolder {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  provider: BankProvider;
}

/**
 * Error de Prometeo API
 * @example
 * ```ts
 * const value: PrometeoError = {} as PrometeoError;
 * console.log(value);
 * ```
 */

export interface PrometeoError {
  status: string;
  message: string;
  code?: string;
}
