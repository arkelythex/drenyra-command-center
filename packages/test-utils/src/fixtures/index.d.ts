export declare const VALID_RUCS: {
    readonly DRENYRA: "20546296564";
    readonly EMPRESA_TEST: "20601234573";
    readonly PROVEEDOR_DEMO: "20601234581";
    readonly CLIENTE_DEMO: "20601234590";
    readonly PERSONA_NATURAL: "10701234567";
    readonly GRAN_EMPRESA: "20601234603";
};
export declare const INVALID_RUCS: {
    readonly TOO_SHORT: "2012345678";
    readonly TOO_LONG: "201234567890";
    readonly BAD_CHECKSUM: "20123456780";
    readonly NON_NUMERIC: "20ABC345678";
    readonly ALL_ZEROS: "00000000000";
    readonly EMPTY: "";
};
export declare const VALID_DNIS: {
    readonly JUAN_PEREZ: "70123456";
    readonly MARIA_GARCIA: "71234567";
    readonly CARLOS_LOPEZ: "72345678";
};
export declare const INVALID_DNIS: {
    readonly TOO_SHORT: "1234567";
    readonly TOO_LONG: "123456789";
    readonly NON_NUMERIC: "ABCDEFGH";
    readonly EMPTY: "";
};
export declare const TEST_COMPANIES: {
    readonly DRENYRA: {
        readonly id: "cmp_drenyra";
        readonly razonSocial: "DRENYRA Sociedad Anónima Cerrada";
        readonly commercialName: "DRENYRA";
        readonly ruc: "20546296564";
        readonly address: "Av. Javier Prado Este 1234, San Isidro, Lima";
        readonly department: "Lima";
        readonly province: "Lima";
        readonly district: "San Isidro";
        readonly phone: "+51 1 234 5678";
        readonly email: "contacto@drenyrafounders.com";
        readonly currency: "PEN";
        readonly isActive: true;
        readonly plan: "enterprise";
    };
    readonly EMPRESA_TEST: {
        readonly id: "cmp_test";
        readonly razonSocial: "Empresa de Prueba SAC";
        readonly commercialName: "Empresa Test";
        readonly ruc: "20601234573";
        readonly address: "Av. Test 123, Miraflores, Lima";
        readonly department: "Lima";
        readonly province: "Lima";
        readonly district: "Miraflores";
        readonly phone: "+51 999 888 777";
        readonly email: "contacto@empresa-test.pe";
        readonly currency: "PEN";
        readonly isActive: true;
        readonly plan: "pro";
    };
    readonly PROVEEDOR_DEMO: {
        readonly id: "cmp_proveedor";
        readonly razonSocial: "Proveedor Demo SAC";
        readonly commercialName: "Proveedor Demo";
        readonly ruc: "20601234581";
        readonly address: "Calle Demo 456, Surco, Lima";
        readonly department: "Lima";
        readonly province: "Lima";
        readonly district: "Santiago de Surco";
        readonly phone: "+51 1 345 6789";
        readonly email: "ventas@proveedor-demo.pe";
        readonly currency: "PEN";
        readonly isActive: true;
        readonly plan: "free";
    };
};
export declare const TEST_USERS: {
    readonly ADMIN: {
        readonly id: "usr_admin";
        readonly email: "admin@drenyrafounders.com";
        readonly name: "Admin DRENYRA";
        readonly role: "admin";
        readonly tenantId: 1;
        readonly isActive: true;
        readonly emailVerified: true;
    };
    readonly ACCOUNTANT: {
        readonly id: "usr_accountant";
        readonly email: "contador@drenyrafounders.com";
        readonly name: "Contador Test";
        readonly role: "accountant";
        readonly tenantId: 1;
        readonly isActive: true;
        readonly emailVerified: true;
    };
    readonly REGULAR_USER: {
        readonly id: "usr_regular";
        readonly email: "usuario@drenyrafounders.com";
        readonly name: "Usuario Regular";
        readonly role: "user";
        readonly tenantId: 1;
        readonly isActive: true;
        readonly emailVerified: true;
    };
    readonly INACTIVE_USER: {
        readonly id: "usr_inactive";
        readonly email: "inactivo@drenyrafounders.com";
        readonly name: "Usuario Inactivo";
        readonly role: "user";
        readonly tenantId: 1;
        readonly isActive: false;
        readonly emailVerified: false;
    };
};
export declare const TEST_PRODUCTS: {
    readonly CONSULTING: {
        readonly id: "prod_consulting";
        readonly description: "Servicio de consultoría tecnológica";
        readonly unitPrice: 5000;
        readonly currency: "PEN";
        readonly igvRate: 0.18;
    };
    readonly SOFTWARE_LICENSE: {
        readonly id: "prod_software";
        readonly description: "Licencia de software DRENYRA";
        readonly unitPrice: 2500;
        readonly currency: "PEN";
        readonly igvRate: 0.18;
    };
    readonly SUPPORT_PLAN: {
        readonly id: "prod_support";
        readonly description: "Plan de soporte premium mensual";
        readonly unitPrice: 800;
        readonly currency: "PEN";
        readonly igvRate: 0.18;
    };
    readonly EXPORT_SERVICE: {
        readonly id: "prod_export";
        readonly description: "Servicio de exportación (exonerado IGV)";
        readonly unitPrice: 3000;
        readonly currency: "USD";
        readonly igvRate: 0;
    };
};
export declare const TEST_INVOICE_SCENARIOS: {
    readonly STANDARD_FACTURA: {
        readonly series: "F001";
        readonly number: 1;
        readonly clientRUC: "20601234590";
        readonly baseAmount: 1000;
        readonly currency: "PEN";
    };
    readonly BOLETA: {
        readonly series: "B001";
        readonly number: 1;
        readonly clientDNI: "70123456";
        readonly baseAmount: 100;
        readonly currency: "PEN";
    };
    readonly MULTI_ITEM: {
        readonly series: "F001";
        readonly number: 2;
        readonly clientRUC: "20601234573";
        readonly items: readonly [{
            readonly description: "Consultoría";
            readonly quantity: 10;
            readonly unitPrice: 500;
        }, {
            readonly description: "Soporte";
            readonly quantity: 1;
            readonly unitPrice: 800;
        }];
        readonly currency: "PEN";
    };
    readonly USD_INVOICE: {
        readonly series: "F001";
        readonly number: 3;
        readonly clientRUC: "20601234603";
        readonly baseAmount: 5000;
        readonly currency: "USD";
    };
    readonly ZERO_AMOUNT: {
        readonly series: "F001";
        readonly number: 4;
        readonly clientRUC: "20546296564";
        readonly baseAmount: 0;
        readonly currency: "PEN";
    };
};
export declare const TEST_ACCOUNTS: {
    readonly CAJA_SOLES: {
        readonly code: "1041";
        readonly name: "Cuentas corrientes - Soles";
        readonly type: "Activo";
        readonly level: "4";
    };
    readonly CAJA_DOLARES: {
        readonly code: "1042";
        readonly name: "Cuentas corrientes - Dólares";
        readonly type: "Activo";
        readonly level: "4";
    };
    readonly CUENTAS_POR_COBRAR: {
        readonly code: "1211";
        readonly name: "Facturas por cobrar";
        readonly type: "Activo";
        readonly level: "4";
    };
    readonly IGV: {
        readonly code: "4011";
        readonly name: "IGV - Cuenta propia";
        readonly type: "Pasivo";
        readonly level: "4";
    };
    readonly VENTAS: {
        readonly code: "7011";
        readonly name: "Ventas - Mercaderías";
        readonly type: "Ingreso";
        readonly level: "4";
    };
    readonly GASTOS_ADMINISTRATIVOS: {
        readonly code: "6311";
        readonly name: "Gastos administrativos";
        readonly type: "Gasto";
        readonly level: "4";
    };
};
export declare const TEST_TENANTS: {
    readonly FREE_TIER: {
        readonly id: "tenant_free";
        readonly name: "Empresa Free Tier";
        readonly plan: "free";
        readonly maxUsers: 2;
        readonly maxInvoices: 50;
        readonly features: {
            readonly multiCurrency: false;
            readonly aiExtraction: false;
            readonly bankingReconciliation: false;
            readonly sunatIntegration: true;
        };
    };
    readonly PRO_TIER: {
        readonly id: "tenant_pro";
        readonly name: "Empresa Pro Tier";
        readonly plan: "pro";
        readonly maxUsers: 10;
        readonly maxInvoices: 500;
        readonly features: {
            readonly multiCurrency: true;
            readonly aiExtraction: true;
            readonly bankingReconciliation: true;
            readonly sunatIntegration: true;
        };
    };
    readonly ENTERPRISE_TIER: {
        readonly id: "tenant_enterprise";
        readonly name: "Empresa Enterprise";
        readonly plan: "enterprise";
        readonly maxUsers: -1;
        readonly maxInvoices: -1;
        readonly features: {
            readonly multiCurrency: true;
            readonly aiExtraction: true;
            readonly bankingReconciliation: true;
            readonly sunatIntegration: true;
            readonly customIntegrations: true;
            readonly dedicatedSupport: true;
        };
    };
};
export interface InvoiceScenarioResult {
    company: (typeof TEST_COMPANIES)[keyof typeof TEST_COMPANIES];
    customer: {
        ruc: string;
        name: string;
    };
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
export declare function createInvoiceScenario(overrides?: {
    company?: Partial<typeof TEST_COMPANIES.EMPRESA_TEST>;
    invoice?: Partial<{
        baseAmount: number;
        series: string;
        number: number;
        currency: string;
        status: string;
    }>;
}): InvoiceScenarioResult;
export interface BankingScenarioResult {
    company: (typeof TEST_COMPANIES)[keyof typeof TEST_COMPANIES];
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
export declare function createBankingScenario(overrides?: {
    transactions?: number;
    account?: Partial<{
        accountNumber: string;
        bankName: string;
        currency: string;
        balance: number;
    }>;
}): BankingScenarioResult;
//# sourceMappingURL=index.d.ts.map