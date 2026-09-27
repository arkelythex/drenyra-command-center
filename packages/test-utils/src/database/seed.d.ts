import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
export interface SeedData {
    users?: Array<{
        email: string;
        password: string;
        role: "admin" | "accountant" | "viewer";
        tenantId?: string;
    }>;
    companies?: Array<{
        name: string;
        ruc: string;
        subscriptionTier: "free" | "pro" | "enterprise";
    }>;
    products?: Array<{
        name: string;
        sku: string;
        price: number;
        currency?: string;
    }>;
    rawSql?: string[];
}
export declare function seedTestData(db: PostgresJsDatabase, data: SeedData): Promise<void>;
export declare const seedScenarios: {
    readonly minimal: {
        readonly users: readonly [{
            readonly email: "admin@test.drenyrafounders.com";
            readonly password: "hashed_test_password_123";
            readonly role: "admin";
        }];
        readonly companies: readonly [{
            readonly name: "Test Company SAC";
            readonly ruc: "20601234567";
            readonly subscriptionTier: "free";
        }];
    };
    readonly full: {
        readonly users: readonly [{
            readonly email: "admin@test.drenyrafounders.com";
            readonly password: "hashed_test_password_123";
            readonly role: "admin";
        }, {
            readonly email: "accountant@test.drenyrafounders.com";
            readonly password: "hashed_test_password_456";
            readonly role: "accountant";
        }];
        readonly companies: readonly [{
            readonly name: "Test Company SAC";
            readonly ruc: "20601234567";
            readonly subscriptionTier: "pro";
        }];
        readonly products: readonly [{
            readonly name: "Producto de prueba";
            readonly sku: "TEST-001";
            readonly price: 100;
            readonly currency: "PEN";
        }, {
            readonly name: "Servicio de prueba";
            readonly sku: "TEST-002";
            readonly price: 250.5;
            readonly currency: "PEN";
        }];
    };
    readonly multiTenant: {
        readonly users: readonly [{
            readonly email: "admin-a@test.drenyrafounders.com";
            readonly password: "hashed_test_password_a";
            readonly role: "admin";
        }, {
            readonly email: "admin-b@test.drenyrafounders.com";
            readonly password: "hashed_test_password_b";
            readonly role: "admin";
        }];
        readonly companies: readonly [{
            readonly name: "Tenant A SAC";
            readonly ruc: "20601234567";
            readonly subscriptionTier: "free";
        }, {
            readonly name: "Tenant B SAC";
            readonly ruc: "20609876543";
            readonly subscriptionTier: "enterprise";
        }];
    };
};
//# sourceMappingURL=seed.d.ts.map