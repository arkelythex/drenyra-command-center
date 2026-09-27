export const VALID_RUCS = {
    DRENYRA: "20546296564",
    EMPRESA_TEST: "20601234573",
    PROVEEDOR_DEMO: "20601234581",
    CLIENTE_DEMO: "20601234590",
    PERSONA_NATURAL: "10701234567",
    GRAN_EMPRESA: "20601234603",
};
export const INVALID_RUCS = {
    TOO_SHORT: "2012345678",
    TOO_LONG: "201234567890",
    BAD_CHECKSUM: "20123456780",
    NON_NUMERIC: "20ABC345678",
    ALL_ZEROS: "00000000000",
    EMPTY: "",
};
export const VALID_DNIS = {
    JUAN_PEREZ: "70123456",
    MARIA_GARCIA: "71234567",
    CARLOS_LOPEZ: "72345678",
};
export const INVALID_DNIS = {
    TOO_SHORT: "1234567",
    TOO_LONG: "123456789",
    NON_NUMERIC: "ABCDEFGH",
    EMPTY: "",
};
export const TEST_COMPANIES = {
    DRENYRA: {
        id: "cmp_drenyra",
        razonSocial: "DRENYRA Sociedad Anónima Cerrada",
        commercialName: "DRENYRA",
        ruc: VALID_RUCS.DRENYRA,
        address: "Av. Javier Prado Este 1234, San Isidro, Lima",
        department: "Lima",
        province: "Lima",
        district: "San Isidro",
        phone: "+51 1 234 5678",
        email: "contacto@drenyrafounders.com",
        currency: "PEN",
        isActive: true,
        plan: "enterprise",
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
        currency: "PEN",
        isActive: true,
        plan: "pro",
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
        currency: "PEN",
        isActive: true,
        plan: "free",
    },
};
export const TEST_USERS = {
    ADMIN: {
        id: "usr_admin",
        email: "admin@drenyrafounders.com",
        name: "Admin DRENYRA",
        role: "admin",
        tenantId: 1,
        isActive: true,
        emailVerified: true,
    },
    ACCOUNTANT: {
        id: "usr_accountant",
        email: "contador@drenyrafounders.com",
        name: "Contador Test",
        role: "accountant",
        tenantId: 1,
        isActive: true,
        emailVerified: true,
    },
    REGULAR_USER: {
        id: "usr_regular",
        email: "usuario@drenyrafounders.com",
        name: "Usuario Regular",
        role: "user",
        tenantId: 1,
        isActive: true,
        emailVerified: true,
    },
    INACTIVE_USER: {
        id: "usr_inactive",
        email: "inactivo@drenyrafounders.com",
        name: "Usuario Inactivo",
        role: "user",
        tenantId: 1,
        isActive: false,
        emailVerified: false,
    },
};
export const TEST_PRODUCTS = {
    CONSULTING: {
        id: "prod_consulting",
        description: "Servicio de consultoría tecnológica",
        unitPrice: 5000,
        currency: "PEN",
        igvRate: 0.18,
    },
    SOFTWARE_LICENSE: {
        id: "prod_software",
        description: "Licencia de software DRENYRA",
        unitPrice: 2500,
        currency: "PEN",
        igvRate: 0.18,
    },
    SUPPORT_PLAN: {
        id: "prod_support",
        description: "Plan de soporte premium mensual",
        unitPrice: 800,
        currency: "PEN",
        igvRate: 0.18,
    },
    EXPORT_SERVICE: {
        id: "prod_export",
        description: "Servicio de exportación (exonerado IGV)",
        unitPrice: 3000,
        currency: "USD",
        igvRate: 0,
    },
};
export const TEST_INVOICE_SCENARIOS = {
    STANDARD_FACTURA: {
        series: "F001",
        number: 1,
        clientRUC: VALID_RUCS.CLIENTE_DEMO,
        baseAmount: 1000,
        currency: "PEN",
    },
    BOLETA: {
        series: "B001",
        number: 1,
        clientDNI: VALID_DNIS.JUAN_PEREZ,
        baseAmount: 100,
        currency: "PEN",
    },
    MULTI_ITEM: {
        series: "F001",
        number: 2,
        clientRUC: VALID_RUCS.EMPRESA_TEST,
        items: [
            { description: "Consultoría", quantity: 10, unitPrice: 500 },
            { description: "Soporte", quantity: 1, unitPrice: 800 },
        ],
        currency: "PEN",
    },
    USD_INVOICE: {
        series: "F001",
        number: 3,
        clientRUC: VALID_RUCS.GRAN_EMPRESA,
        baseAmount: 5000,
        currency: "USD",
    },
    ZERO_AMOUNT: {
        series: "F001",
        number: 4,
        clientRUC: VALID_RUCS.DRENYRA,
        baseAmount: 0,
        currency: "PEN",
    },
};
export const TEST_ACCOUNTS = {
    CAJA_SOLES: {
        code: "1041",
        name: "Cuentas corrientes - Soles",
        type: "Activo",
        level: "4",
    },
    CAJA_DOLARES: {
        code: "1042",
        name: "Cuentas corrientes - Dólares",
        type: "Activo",
        level: "4",
    },
    CUENTAS_POR_COBRAR: {
        code: "1211",
        name: "Facturas por cobrar",
        type: "Activo",
        level: "4",
    },
    IGV: {
        code: "4011",
        name: "IGV - Cuenta propia",
        type: "Pasivo",
        level: "4",
    },
    VENTAS: {
        code: "7011",
        name: "Ventas - Mercaderías",
        type: "Ingreso",
        level: "4",
    },
    GASTOS_ADMINISTRATIVOS: {
        code: "6311",
        name: "Gastos administrativos",
        type: "Gasto",
        level: "4",
    },
};
export const TEST_TENANTS = {
    FREE_TIER: {
        id: "tenant_free",
        name: "Empresa Free Tier",
        plan: "free",
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
        plan: "pro",
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
        plan: "enterprise",
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
};
export function createInvoiceScenario(overrides) {
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
export function createBankingScenario(overrides) {
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
            amount: [5000, -1200, 3000, 2500, -4500, -800, -1500, 2000, 150, -3500][i % 10],
            type: i % 2 === 0 ? "DEPOSIT" : "WITHDRAWAL",
        };
    });
    return {
        company: {
            ...TEST_COMPANIES.DRENYRA,
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
//# sourceMappingURL=index.js.map