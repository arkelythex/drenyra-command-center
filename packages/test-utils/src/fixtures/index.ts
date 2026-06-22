/**
 * Canonical test fixtures for ARKELYTHEX.
 *
 * Provides reusable, realistic Peruvian tax data for testing.
 * All RUCs here pass the Módulo 11 checksum validation.
 *
 * @module fixtures
 */

// ============================================================
// VALID PERUVIAN RUCs (Módulo 11 verified)
// ============================================================

/**
 * Valid RUCs for testing. All pass SUNAT Módulo 11 validation.
 *
 * - 20xxxxxxx: Persona Jurídica (Empresa)
 * - 10xxxxxxx: Persona Natural
 */
export const VALID_RUCS = {
	/** ARKELYTHEX SAC — Empresa de prueba principal */
	ARKELYTHEX: "20546296564",
	/** Empresa Test SAC — Segunda empresa de prueba */
	EMPRESA_TEST: "20601234573",
	/** Proveedor Demo SAC — Proveedor de prueba */
	PROVEEDOR_DEMO: "20601234581",
	/** Cliente Demo SAC — Cliente de prueba */
	CLIENTE_DEMO: "20601234590",
	/** Persona Natural Test — Juan Pérez */
	PERSONA_NATURAL: "10701234567",
	/** Gran Empresa SAC — Para tests enterprise */
	GRAN_EMPRESA: "20601234603",
} as const;

/**
 * Invalid RUCs for negative testing.
 */
export const INVALID_RUCS = {
	/** Too short (10 digits) */
	TOO_SHORT: "2012345678",
	/** Too long (12 digits) */
	TOO_LONG: "201234567890",
	/** Wrong checksum */
	BAD_CHECKSUM: "20123456780",
	/** Non-numeric characters */
	NON_NUMERIC: "20ABC345678",
	/** All zeros */
	ALL_ZEROS: "00000000000",
	/** Empty string */
	EMPTY: "",
} as const;

// ============================================================
// VALID PERUVIAN DNIs
// ============================================================

export const VALID_DNIS = {
	/** Juan Pérez — DNI de prueba */
	JUAN_PEREZ: "70123456",
	/** María García — DNI de prueba */
	MARIA_GARCIA: "71234567",
	/** Carlos López — DNI de prueba */
	CARLOS_LOPEZ: "72345678",
} as const;

export const INVALID_DNIS = {
	/** Too short (7 digits) */
	TOO_SHORT: "1234567",
	/** Too long (9 digits) */
	TOO_LONG: "123456789",
	/** Non-numeric */
	NON_NUMERIC: "ABCDEFGH",
	/** Empty */
	EMPTY: "",
} as const;

// ============================================================
// TEST COMPANIES
// ============================================================

export const TEST_COMPANIES = {
	ARKELYTHEX: {
		id: "cmp_arkelythex",
		razonSocial: "ARKELYTHEX Sociedad Anónima Cerrada",
		commercialName: "ARKELYTHEX",
		ruc: VALID_RUCS.ARKELYTHEX,
		address: "Av. Javier Prado Este 1234, San Isidro, Lima",
		department: "Lima",
		province: "Lima",
		district: "San Isidro",
		phone: "+51 1 234 5678",
		email: "contacto@arkelythexfounders.com",
		currency: "PEN" as const,
		isActive: true,
		plan: "enterprise" as const,
	},
	EMPRESA_TEST: {
		id: "cmp_test",
		razonSocial: "Empresa de Prueba SAC",
		commercialName: "Empresa Test",
		ruc: VALID_RUCS.EMPRESA_TEST,
		address: "Av. Test 123, Miraflores, Lima",
		department: "Lima",
		province: "Lima",
		district: "Miraflores",
		phone: "+51 999 888 777",
		email: "contacto@empresa-test.pe",
		currency: "PEN" as const,
		isActive: true,
		plan: "pro" as const,
	},
	PROVEEDOR_DEMO: {
		id: "cmp_proveedor",
		razonSocial: "Proveedor Demo SAC",
		commercialName: "Proveedor Demo",
		ruc: VALID_RUCS.PROVEEDOR_DEMO,
		address: "Calle Demo 456, Surco, Lima",
		department: "Lima",
		province: "Lima",
		district: "Santiago de Surco",
		phone: "+51 1 345 6789",
		email: "ventas@proveedor-demo.pe",
		currency: "PEN" as const,
		isActive: true,
		plan: "free" as const,
	},
} as const;

// ============================================================
// TEST USERS
// ============================================================

export const TEST_USERS = {
	ADMIN: {
		id: "usr_admin",
		email: "admin@arkelythexfounders.com",
		name: "Admin ARKELYTHEX",
		role: "admin",
		tenantId: 1,
		isActive: true,
		emailVerified: true,
	},
	ACCOUNTANT: {
		id: "usr_accountant",
		email: "contador@arkelythexfounders.com",
		name: "Contador Test",
		role: "accountant",
		tenantId: 1,
		isActive: true,
		emailVerified: true,
	},
	REGULAR_USER: {
		id: "usr_regular",
		email: "usuario@arkelythexfounders.com",
		name: "Usuario Regular",
		role: "user",
		tenantId: 1,
		isActive: true,
		emailVerified: true,
	},
	INACTIVE_USER: {
		id: "usr_inactive",
		email: "inactivo@arkelythexfounders.com",
		name: "Usuario Inactivo",
		role: "user",
		tenantId: 1,
		isActive: false,
		emailVerified: false,
	},
} as const;

// ============================================================
// TEST PRODUCTS
// ============================================================

export const TEST_PRODUCTS = {
	CONSULTING: {
		id: "prod_consulting",
		description: "Servicio de consultoría tecnológica",
		unitPrice: 5000,
		currency: "PEN" as const,
		igvRate: 0.18,
	},
	SOFTWARE_LICENSE: {
		id: "prod_software",
		description: "Licencia de software ARKELYTHEX",
		unitPrice: 2500,
		currency: "PEN" as const,
		igvRate: 0.18,
	},
	SUPPORT_PLAN: {
		id: "prod_support",
		description: "Plan de soporte premium mensual",
		unitPrice: 800,
		currency: "PEN" as const,
		igvRate: 0.18,
	},
	EXPORT_SERVICE: {
		id: "prod_export",
		description: "Servicio de exportación (exonerado IGV)",
		unitPrice: 3000,
		currency: "USD" as const,
		igvRate: 0,
	},
} as const;

// ============================================================
// TEST INVOICE SCENARIOS
// ============================================================

export const TEST_INVOICE_SCENARIOS = {
	/** Standard factura with IGV 18% */
	STANDARD_FACTURA: {
		series: "F001",
		number: 1,
		clientRUC: VALID_RUCS.CLIENTE_DEMO,
		baseAmount: 1000,
		currency: "PEN" as const,
	},
	/** Boleta de venta (B2C) */
	BOLETA: {
		series: "B001",
		number: 1,
		clientDNI: VALID_DNIS.JUAN_PEREZ,
		baseAmount: 100,
		currency: "PEN" as const,
	},
	/** Multi-item factura */
	MULTI_ITEM: {
		series: "F001",
		number: 2,
		clientRUC: VALID_RUCS.EMPRESA_TEST,
		items: [
			{ description: "Consultoría", quantity: 10, unitPrice: 500 },
			{ description: "Soporte", quantity: 1, unitPrice: 800 },
		],
		currency: "PEN" as const,
	},
	/** USD invoice for export */
	USD_INVOICE: {
		series: "F001",
		number: 3,
		clientRUC: VALID_RUCS.GRAN_EMPRESA,
		baseAmount: 5000,
		currency: "USD" as const,
	},
	/** Zero-amount invoice (edge case) */
	ZERO_AMOUNT: {
		series: "F001",
		number: 4,
		clientRUC: VALID_RUCS.ARKELYTHEX,
		baseAmount: 0,
		currency: "PEN" as const,
	},
} as const;

// ============================================================
// TEST ACCOUNTS (PCGE)
// ============================================================

export const TEST_ACCOUNTS = {
	/** 1041 - Cuentas corrientes en entidades financieras (Soles) */
	CAJA_SOLES: {
		code: "1041",
		name: "Cuentas corrientes - Soles",
		type: "Activo" as const,
		level: "4" as const,
	},
	/** 1042 - Cuentas corrientes en entidades financieras (Dólares) */
	CAJA_DOLARES: {
		code: "1042",
		name: "Cuentas corrientes - Dólares",
		type: "Activo" as const,
		level: "4" as const,
	},
	/** 1211 - Facturas, boletas y otros comprobantes por cobrar */
	CUENTAS_POR_COBRAR: {
		code: "1211",
		name: "Facturas por cobrar",
		type: "Activo" as const,
		level: "4" as const,
	},
	/** 4011 - IGV - Cuenta propia */
	IGV: {
		code: "4011",
		name: "IGV - Cuenta propia",
		type: "Pasivo" as const,
		level: "4" as const,
	},
	/** 7011 - Ventas - Mercaderías */
	VENTAS: {
		code: "7011",
		name: "Ventas - Mercaderías",
		type: "Ingreso" as const,
		level: "4" as const,
	},
	/** 6311 - Remuneraciones - Sueldos y salarios */
	GASTOS_ADMINISTRATIVOS: {
		code: "6311",
		name: "Gastos administrativos",
		type: "Gasto" as const,
		level: "4" as const,
	},
} as const;

// ============================================================
// TEST TENANTS
// ============================================================

export const TEST_TENANTS = {
	FREE_TIER: {
		id: "tenant_free",
		name: "Empresa Free Tier",
		plan: "free" as const,
		maxUsers: 2,
		maxInvoices: 50,
		features: {
			multiCurrency: false,
			aiExtraction: false,
			bankingReconciliation: false,
			sunatIntegration: true,
		},
	},
	PRO_TIER: {
		id: "tenant_pro",
		name: "Empresa Pro Tier",
		plan: "pro" as const,
		maxUsers: 10,
		maxInvoices: 500,
		features: {
			multiCurrency: true,
			aiExtraction: true,
			bankingReconciliation: true,
			sunatIntegration: true,
		},
	},
	ENTERPRISE_TIER: {
		id: "tenant_enterprise",
		name: "Empresa Enterprise",
		plan: "enterprise" as const,
		maxUsers: -1,
		maxInvoices: -1,
		features: {
			multiCurrency: true,
			aiExtraction: true,
			bankingReconciliation: true,
			sunatIntegration: true,
			customIntegrations: true,
			dedicatedSupport: true,
		},
	},
} as const;

// ============================================================
// SCENARIO FACTORY FUNCTIONS
// ============================================================

// ============================================================
// SIRE FIXTURES
// ============================================================

// sire-fixtures.ts was removed (types no longer exist in codebase)

/**
 * Result of createInvoiceScenario factory.
 */
export interface InvoiceScenarioResult {
	company: typeof TEST_COMPANIES[keyof typeof TEST_COMPANIES];
	customer: { ruc: string; name: string };
	invoice: {
		id: string;
		series: string;
		number: number;
		clientRUC: string;
		clientName: string;
		baseAmount: number;
		igvAmount: number;
		totalAmount: number;
		currency: string;
		status: string;
	};
}

/**
 * Create a complete invoice scenario ready for testing.
 *
 * Returns linked company, customer, and invoice data with valid
 * Peruvian RUCs that pass Módulo 11 validation.
 *
 * @param overrides - Optional overrides to customize the scenario
 *
 * @example
 * ```ts
 * const { company, customer, invoice } = createInvoiceScenario();
 * // company.ruc === "20601234573"
 * // customer.ruc === "20601234590"
 * // invoice.baseAmount === 1000
 *
 * const custom = createInvoiceScenario({ invoice: { baseAmount: 500 } });
 * // custom.invoice.baseAmount === 500
 * ```
 */
export function createInvoiceScenario(
	overrides?: {
		company?: Partial<typeof TEST_COMPANIES.EMPRESA_TEST>;
		invoice?: Partial<{
			baseAmount: number;
			series: string;
			number: number;
			currency: string;
			status: string;
		}>;
	},
): InvoiceScenarioResult {
	const baseAmount = overrides?.invoice?.baseAmount ?? 1000;
	const igvAmount = Math.round(baseAmount * 0.18);
	const totalAmount = baseAmount + igvAmount;

	return {
		company: {
			...TEST_COMPANIES.EMPRESA_TEST,
			...overrides?.company,
		},
		customer: {
			ruc: VALID_RUCS.CLIENTE_DEMO,
			name: "Cliente Demo SAC",
		},
		invoice: {
			id: `inv_factory_${Date.now()}`,
			series: overrides?.invoice?.series ?? "F001",
			number: overrides?.invoice?.number ?? 1,
			clientRUC: VALID_RUCS.CLIENTE_DEMO,
			clientName: "Cliente Demo SAC",
			baseAmount,
			igvAmount,
			totalAmount,
			currency: overrides?.invoice?.currency ?? "PEN",
			status: overrides?.invoice?.status ?? "DRAFT",
		},
	};
}

/**
 * Result of createBankingScenario factory.
 */
export interface BankingScenarioResult {
	company: typeof TEST_COMPANIES[keyof typeof TEST_COMPANIES];
	bankAccount: {
		id: string;
		accountNumber: string;
		bankName: string;
		currency: string;
		balance: number;
	};
	transactions: Array<{
		id: string;
		date: Date;
		description: string;
		amount: number;
		type: string;
	}>;
}

/**
 * Create a complete banking scenario ready for testing.
 *
 * Returns linked company, bank account, and transaction data with
 * realistic dates and amounts.
 *
 * @param overrides - Optional overrides to customize the scenario
 *
 * @example
 * ```ts
 * const { company, bankAccount, transactions } = createBankingScenario();
 * // bankAccount.bankName === "Banco de Prueba"
 * // transactions.length === 5
 *
 * const custom = createBankingScenario({ transactions: 10 });
 * // custom.transactions.length === 10
 * ```
 */
export function createBankingScenario(
	overrides?: {
		transactions?: number;
		account?: Partial<{
			accountNumber: string;
			bankName: string;
			currency: string;
			balance: number;
		}>;
	},
): BankingScenarioResult {
	const transactionCount = overrides?.transactions ?? 5;
	const today = new Date();

	const transactions = Array.from({ length: transactionCount }, (_, i) => {
		const date = new Date(today);
		date.setDate(date.getDate() - (transactionCount - i));
		return {
			id: `tx_bank_${i + 1}`,
			date,
			description: [
				"Depósito por venta de servicios",
				"Pago a proveedor",
				"Transferencia entre cuentas",
				"Cobro de factura",
				"Pago de planilla",
				"Pago de servicios públicos",
				"Compra de materiales",
				"Devolución de cliente",
				"Abono de interés",
				"Pago de impuestos",
			][i % 10],
			amount: [5000, -1200, 3000, 2500, -4500, -800, -1500, 2000, 150, -3500][
				i % 10
			],
			type: i % 2 === 0 ? ("DEPOSIT" as const) : ("WITHDRAWAL" as const),
		};
	});

	return {
		company: {
			...TEST_COMPANIES.ARKELYTHEX,
		},
		bankAccount: {
			id: `acc_bank_${Date.now()}`,
			accountNumber: overrides?.account?.accountNumber ?? "191-1234567-0-00",
			bankName: overrides?.account?.bankName ?? "Banco de Prueba",
			currency: overrides?.account?.currency ?? "PEN",
			balance: overrides?.account?.balance ?? 15000,
		},
		transactions,
	};
}
