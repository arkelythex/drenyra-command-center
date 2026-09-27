export interface TenantContext {
    tenantId: string;
    tenantName: string;
    subscriptionTier: "free" | "pro" | "enterprise";
    ruc: string;
    headers: Record<string, string>;
}
export declare function createTenantContext(options: {
    tenantId: string;
    tenantName: string;
    subscriptionTier: "free" | "pro" | "enterprise";
    ruc: string;
    authToken?: string;
}): TenantContext;
export declare const tenantFixtures: {
    readonly freeTenant: TenantContext;
    readonly proTenant: TenantContext;
    readonly enterpriseTenant: TenantContext;
};
export declare function assertTenantIsolation(response: {
    status: number;
    data?: unknown;
}, message?: string): void;
export declare function assertTenantData(data: Record<string, unknown> | Array<Record<string, unknown>>, expectedTenantId: string, message?: string): void;
export declare function generateTenantId(prefix?: string): string;
export declare const tierFeatures: {
    readonly free: {
        readonly maxInvoices: 50;
        readonly maxUsers: 1;
        readonly sunatIntegration: false;
        readonly bankingIntegration: false;
        readonly aiFeatures: false;
        readonly apiAccess: false;
        readonly customReports: false;
        readonly multiCurrency: false;
    };
    readonly pro: {
        readonly maxInvoices: 500;
        readonly maxUsers: 5;
        readonly sunatIntegration: true;
        readonly bankingIntegration: true;
        readonly aiFeatures: false;
        readonly apiAccess: true;
        readonly customReports: false;
        readonly multiCurrency: false;
    };
    readonly enterprise: {
        readonly maxInvoices: number;
        readonly maxUsers: number;
        readonly sunatIntegration: true;
        readonly bankingIntegration: true;
        readonly aiFeatures: true;
        readonly apiAccess: true;
        readonly customReports: true;
        readonly multiCurrency: true;
    };
};
export declare function hasFeature<K extends keyof (typeof tierFeatures)["free"]>(tier: "free" | "pro" | "enterprise", feature: K): boolean;
export declare function assertFeatureDenied(tier: "free" | "pro" | "enterprise", feature: keyof (typeof tierFeatures)["free"], message?: string): void;
export declare function assertFeatureAllowed(tier: "free" | "pro" | "enterprise", feature: keyof (typeof tierFeatures)["free"], message?: string): void;
//# sourceMappingURL=index.d.ts.map