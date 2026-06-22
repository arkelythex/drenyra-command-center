/**
 * SIRE Types - SUNAT Electronic Registers (Sistema Integrado de Registros Electrónicos).
 *
 * Type definitions for SUNAT's electronic bookkeeping system. All taxpayers
 * must submit monthly purchase and sales registers in these exact formats.
 *
 * **SUNAT Compliance:**
 * - Required since January 2026
 * - Submission deadline: Day 10 of following month
 * - Format: Pipe-delimited TXT (|) or Excel
 * - Encoding: UTF-8
 * - Legal basis: Resolución de Superintendencia N° 271-2013-SUNAT
 *
 * **File Structure:**
 * - Each line = one transaction
 * - Fields separated by pipe (|)
 * - No headers
 * - Date format: DD/MM/YYYY
 * - Amount format: 0.00 (2 decimals)
 *
 * @see {@link https://www.sunat.gob.pe/legislacion/superin/2013/271-2013.pdf} SUNAT Resolution 271-2013
 * @see {@link /apps/api/src/services/sire.service.ts} SIRE Service implementation
 * @see {@link /apps/api/src/services/sire.service.spec.ts} Test cases
 */

/**
 * Sales Register Record (Registro de Ventas).
 *
 * Represents one sales transaction in SUNAT format. Each company must submit
 * all sales (invoices, receipts, credit/debit notes) monthly.
 *
 * **SUNAT Requirements:**
 * - 30 fields total (pipe-delimited)
 * - Correlativo must be sequential (1, 2, 3, ...)
 * - Period format: YYYYMM00 (e.g., "20260100" for January 2026)
 * - All monetary amounts with 2 decimals
 * - Customer RUC validated via Módulo 11
 *
 * **Document Types:**
 * - 01 = Factura (Invoice)
 * - 03 = Boleta (Receipt)
 * - 07 = Nota de Crédito (Credit Note)
 * - 08 = Nota de Débito (Debit Note)
 *
 * **Edge Cases:**
 * - Export sales (valorExportacion > 0, IGV = 0)
 * - Tax-exempt sales (importeExonerado > 0, IGV = 0)
 * - Credit notes (fechaEmisionModificado filled)
 * - Cancelled invoices (estado = '2')
 *
 * @example
 * ```ts
 * // Example: Invoice for S/ 1,180 (S/ 1,000 + S/ 180 IGV)
 * const record: SIRESalesRecord = {
 *   periodo: '20260100',
 *   correlativo: '1',
 *   fechaEmision: '15/01/2026',
 *   tipoComprobante: '01',
 *   serie: 'F001',
 *   numero: '00000001',
 *   numeroFinal: '00000001',
 *   tipoDocumentoCliente: '6',
 *   numeroDocumentoCliente: '20123456789',
 *   razonSocialCliente: 'ACME SAC',
 *   valorExportacion: 0,
 *   baseImponibleOGravada: 1000.00,
 *   descuentoBaseImponible: 0,
 *   igv: 180.00, // 18%
 *   descuentoIGV: 0,
 *   importeExonerado: 0,
 *   importeInafecto: 0,
 *   isc: 0,
 *   baseImponibleIVAP: 0,
 *   ivap: 0,
 *   icbper: 0,
 *   otrosTributos: 0,
 *   totalComprobante: 1180.00,
 *   tipoMoneda: 'PEN',
 *   tipoCambio: 1.000,
 *   fechaEmisionModificado: '',
 *   tipoComprobanteModificado: '',
 *   serieModificado: '',
 *   numeroModificado: '',
 *   estado: '1'
 * };
 * ```
 *
 * @see {@link https://orientacion.sunat.gob.pe/sites/default/files/inline-files/Estructura_RV.pdf} SUNAT Sales Register Structure
 */
export interface SIRESalesRecord {
  // Period and correlation
  periodo: string;              // YYYYMM00 (e.g., "20260100")
  correlativo: string;          // Sequential number (e.g., "1", "2", "3")
  
  // Document information
  fechaEmision: string;         // DD/MM/YYYY
  tipoComprobante: string;      // 01=Factura, 03=Boleta, 07=Nota Crédito, 08=Nota Débito
  serie: string;                // F001, B001, etc.
  numero: string;               // 00000001
  numeroFinal: string;          // For ranges (usually same as numero)
  
  // Customer information
  tipoDocumentoCliente: string; // 6=RUC, 1=DNI, 4=CE, 0=Otros
  numeroDocumentoCliente: string;
  razonSocialCliente: string;
  
  // Amounts
  valorExportacion: number;     // Export value (usually 0.00)
  baseImponibleOGravada: number; // Taxable base (subtotal)
  descuentoBaseImponible: number; // Discounts (usually 0.00)
  igv: number;                  // 18% tax
  descuentoIGV: number;         // IGV discounts (usually 0.00)
  importeExonerado: number;     // Tax-exempt amount (usually 0.00)
  importeInafecto: number;      // Non-taxable amount (usually 0.00)
  isc: number;                  // Selective consumption tax (usually 0.00)
  baseImponibleIVAP: number;    // Rice tax base (usually 0.00)
  ivap: number;                 // Rice tax (usually 0.00)
  icbper: number;               // Plastic bag tax (usually 0.00)
  otrosTributos: number;        // Other taxes (usually 0.00)
  totalComprobante: number;     // Total amount
  
  // Currency and exchange
  tipoMoneda: string;           // PEN, USD
  tipoCambio: number;           // Exchange rate (1.000 for PEN)
  
  // Reference (for credit/debit notes)
  fechaEmisionModificado: string; // DD/MM/YYYY or empty
  tipoComprobanteModificado: string; // 01, 03, etc. or empty
  serieModificado: string;      // F001, etc. or empty
  numeroModificado: string;     // 00000001 or empty
  
  // Status
  estado: string;               // 1=Activo, 2=Anulado, 0=Otros
}

/**
 * Purchases Register Record (Registro de Compras).
 *
 * Represents one purchase transaction in SUNAT format. Each company must
 * submit all purchases (supplier invoices, import documents) monthly.
 *
 * **SUNAT Requirements:**
 * - 35 fields total (pipe-delimited)
 * - Includes detraction and retention fields
 * - DUA (customs) support for imports
 * - Due date required (fechaVencimiento)
 *
 * **Document Types:**
 * - 01 = Factura (Supplier Invoice)
 * - 03 = Boleta (Receipt)
 * - 14 = Recibo de Servicios Públicos (Utilities)
 * - 91 = Nota de Crédito Especial (Special Credit Note)
 *
 * **Detracciones (SPOT):**
 * - Required for services > S/ 700 (12% withheld)
 * - Fields: fechaDetraccion, numeroDetraccion
 * - Must be paid within 5 business days
 *
 * **Edge Cases:**
 * - Import with DUA (anoDUA filled, special validation)
 * - Credit notes (serieModificado filled)
 * - Non-taxable purchases (baseImponibleNoGravada > 0)
 * - Goods classification for tax credit (clasificacionBienes)
 *
 * @example
 * ```ts
 * // Example: Purchase of S/ 1,180 (S/ 1,000 + S/ 180 IGV)
 * const record: SIREPurchasesRecord = {
 *   periodo: '20260100',
 *   correlativo: '1',
 *   fechaEmision: '10/01/2026',
 *   fechaVencimiento: '10/02/2026', // 30 days credit
 *   tipoComprobante: '01',
 *   serie: 'F001',
 *   anoDUA: '',
 *   numeroComprobante: '00000001',
 *   numeroFinal: '00000001',
 *   tipoDocumentoProveedor: '6',
 *   numeroDocumentoProveedor: '20987654321',
 *   razonSocialProveedor: 'Supplier SAC',
 *   baseImponible: 1000.00,
 *   igv: 180.00, // 18%
 *   baseImponibleNoGravada: 0,
 *   igvNoGravado: 0,
 *   baseImponibleNoGravadaNG: 0,
 *   igvNoGravadoNG: 0,
 *   valorAdquisicionesNG: 0,
 *   isc: 0,
 *   icbper: 0,
 *   otrosTributos: 0,
 *   totalComprobante: 1180.00,
 *   tipoMoneda: 'PEN',
 *   tipoCambio: 1.000,
 *   fechaEmisionModificado: '',
 *   tipoComprobanteModificado: '',
 *   serieModificado: '',
 *   numeroDUAModificado: '',
 *   numeroModificado: '',
 *   fechaDetraccion: '12/01/2026',
 *   numeroDetraccion: 'D001-00000123',
 *   retencion: '',
 *   estado: '1',
 *   clasificacionBienes: '1' // Goods for tax credit
 * };
 * ```
 *
 * @see {@link https://orientacion.sunat.gob.pe/sites/default/files/inline-files/Estructura_RC.pdf} SUNAT Purchases Register Structure
 */
export interface SIREPurchasesRecord {
  // Period and correlation
  periodo: string;              // YYYYMM00
  correlativo: string;          // Sequential
  
  // Document information
  fechaEmision: string;         // DD/MM/YYYY
  fechaVencimiento: string;     // DD/MM/YYYY (due date)
  tipoComprobante: string;      // 01=Factura, 03=Boleta, etc.
  serie: string;
  anoDUA: string;               // Year of DUA (customs) or empty
  numeroComprobante: string;
  numeroFinal: string;
  
  // Supplier information
  tipoDocumentoProveedor: string; // 6=RUC, etc.
  numeroDocumentoProveedor: string;
  razonSocialProveedor: string;
  
  // Amounts
  baseImponible: number;
  igv: number;
  baseImponibleNoGravada: number; // Non-taxable base
  igvNoGravado: number;
  baseImponibleNoGravadaNG: number;
  igvNoGravadoNG: number;
  valorAdquisicionesNG: number;
  isc: number;
  icbper: number;
  otrosTributos: number;
  totalComprobante: number;
  
  // Currency
  tipoMoneda: string;
  tipoCambio: number;
  
  // Reference
  fechaEmisionModificado: string;
  tipoComprobanteModificado: string;
  serieModificado: string;
  numeroDUAModificado: string;
  numeroModificado: string;
  
  // Additional
  fechaDetraccion: string;      // Detraction date or empty
  numeroDetraccion: string;     // Detraction number or empty
  retencion: string;            // Retention indicator
  estado: string;               // 1=Activo, 2=Anulado
  
  // Classification
  clasificacionBienes: string;  // Goods classification (1, 2, 3, or empty)
}

/**
 * SIRE Export Options.
 *
 * Configuration for generating SIRE register files.
 *
 * **Business Rules:**
 * - Year must be >= 2026 (SIRE is mandatory since 2026)
 * - Month must be 1-12
 * - CompanyId must exist in database
 * - TXT format is required for SUNAT submission
 * - EXCEL format is for internal review only
 *
 * @example
 * ```ts
 * const options: SIREExportOptions = {
 *   year: 2026,
 *   month: 1,
 *   companyId: 'cmp_123',
 *   format: 'TXT', // Required for SUNAT
 *   includeHeader: false // Headers not allowed in SUNAT TXT
 * };
 * ```
 */
export interface SIREExportOptions {
  /** Year (YYYY format, must be >= 2026) */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Company UUID */
  companyId: string;
  /** Export format (TXT for SUNAT, EXCEL for review) */
  format: 'TXT' | 'EXCEL';
  /** Include headers (only for EXCEL, ignored for TXT) */
  includeHeader?: boolean;
}

/**
 * SIRE Validation Result.
 *
 * Result of validating a SIRE file against SUNAT rules.
 *
 * **Validation Rules:**
 * - Field count (30 for sales, 35 for purchases)
 * - Period format (YYYYMM00)
 * - RUC validation (Módulo 11)
 * - Amount format (2 decimals)
 * - Required fields presence
 * - Sequential correlativo
 *
 * **Error vs Warning:**
 * - Error: File cannot be submitted to SUNAT (blocking)
 * - Warning: File can be submitted but has issues (non-blocking)
 *
 * @example
 * ```ts
 * const result: SIREValidationResult = {
 *   isValid: false,
 *   errors: [
 *     { line: 1, field: 'periodo', message: 'Period must be YYYYMM00' }
 *   ],
 *   warnings: [
 *     { line: 42, field: 'ruc', message: 'RUC checksum invalid' }
 *   ],
 *   recordCount: 150
 * };
 * ```
 *
 * @see {@link /apps/api/src/services/sire.service.spec.ts} Validation tests
 */
export interface SIREValidationResult {
  /** True if file can be submitted to SUNAT */
  isValid: boolean;
  /** Blocking errors (prevent submission) */
  errors: Array<{
    line: number;
    field: string;
    message: string;
  }>;
  /** Non-blocking warnings (can still submit) */
  warnings: Array<{
    line: number;
    field: string;
    message: string;
  }>;
  /** Total number of records in file */
  recordCount: number;
}

/**
 * SIRE Summary Statistics.
 *
 * High-level statistics for a SIRE register period.
 * Used for dashboards and reports.
 *
 * **Business Use:**
 * - Quick validation before submission
 * - Month-over-month comparisons
 * - Tax credit verification (purchases IGV)
 * - Revenue tracking (sales totals)
 *
 * @example
 * ```ts
 * const summary: SIRESummary = {
 *   period: '2026-01',
 *   recordCount: 150,
 *   totalAmount: 177000.00, // S/ 177,000
 *   totalIGV: 27000.00,     // S/ 27,000 (18%)
 *   currency: 'PEN',
 *   generatedAt: new Date('2026-02-05')
 * };
 *
 * // Validate IGV calculation
 * const expectedIGV = totalAmount / 1.18 * 0.18;
 * console.assert(Math.abs(totalIGV - expectedIGV) < 1);
 * ```
 */
export interface SIRESummary {
  /** Period in YYYY-MM format */
  period: string;
  /** Total number of transactions */
  recordCount: number;
  /** Sum of all totalComprobante fields */
  totalAmount: number;
  /** Sum of all IGV fields */
  totalIGV: number;
  /** Currency code (PEN, USD) */
  currency: string;
  /** Timestamp when summary was generated */
  generatedAt: Date;
}

/**
 * SUNAT live ledger summary retrieved directly from SIRE API.
 *
 * Best-effort snapshot used for cross-checking local reconciliation outputs
 * against SUNAT's current API response in real time.
 */
export interface SIRESunatLiveLedgerSummary {
  ledgerType: 'ventas' | 'compras';
  recordCount: number;
  totalAmount: number;
  totalIGV: number;
}

/**
 * SUNAT live summary check result.
 *
 * - `available`: live API data fetched and parsed successfully.
 * - `unavailable`: live API could not be used (missing credentials/config or API error).
 */
export type SIRESunatLiveUnavailableReason =
  | 'missing_config'
  | 'api_mode_disabled'
  | 'auth_unavailable'
  | 'timeout'
  | 'upstream_error'
  | 'invalid_payload'
  | 'internal_error';

interface SIRESunatLiveSummaryBase {
  source: 'sunat-api';
  period: string;
  checkedAt: string;
}

export interface SIRESunatLiveSummaryAvailable extends SIRESunatLiveSummaryBase {
  status: 'available';
  message: string;
  ledgers: SIRESunatLiveLedgerSummary[];
}

export interface SIRESunatLiveSummaryUnavailable extends SIRESunatLiveSummaryBase {
  status: 'unavailable';
  reason: SIRESunatLiveUnavailableReason;
  message: string;
  ledgers: [];
}

export type SIRESunatLiveSummary =
  | SIRESunatLiveSummaryAvailable
  | SIRESunatLiveSummaryUnavailable;
