export function createTenantContext(options) {
    const headers = {
        "x-tenant-id": options.tenantId,
        "x-tenant-ruc": options.ruc,
        "content-type": "application/json",
    };
    if (options.authToken) {
        headers.authorization = `Bearer ${options.authToken}`;
    }
    return {
        tenantId: options.tenantId,
        tenantName: options.tenantName,
        subscriptionTier: options.subscriptionTier,
        ruc: options.ruc,
        headers,
    };
}
export const tenantFixtures = {
    freeTenant: createTenantContext({
        tenantId: "tenant-free-001",
        tenantName: "Free Tenant SAC",
        subscriptionTier: "free",
        ruc: "20601234567",
    }),
    proTenant: createTenantContext({
        tenantId: "tenant-pro-001",
        tenantName: "Pro Tenant SAC",
        subscriptionTier: "pro",
        ruc: "20609876543",
    }),
    enterpriseTenant: createTenantContext({
        tenantId: "tenant-enterprise-001",
        tenantName: "Enterprise Tenant SAC",
        subscriptionTier: "enterprise",
        ruc: "20601112233",
    }),
};
export function assertTenantIsolation(response, message) {
    const msg = message || "Expected tenant isolation (403 Forbidden)";
    if (response.status !== 403) {
        throw new Error(`${msg}. Expected status 403, got ${response.status}. ` +
            `Response: ${JSON.stringify(response.data)}`);
    }
}
export function assertTenantData(data, expectedTenantId, message) {
    const msg = message || `Expected data to belong to tenant ${expectedTenantId}`;
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
        const tenantId = item.tenantId ?? item.tenant_id ?? item.companyId ?? item.company_id;
        if (tenantId !== expectedTenantId) {
            throw new Error(`${msg}. Expected tenantId "${expectedTenantId}", got "${tenantId}". ` +
                `Data: ${JSON.stringify(item)}`);
        }
    }
}
export function generateTenantId(prefix = "test-tenant") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
export const tierFeatures = {
    free: {
        maxInvoices: 50,
        maxUsers: 1,
        sunatIntegration: false,
        bankingIntegration: false,
        aiFeatures: false,
        apiAccess: false,
        customReports: false,
        multiCurrency: false,
    },
    pro: {
        maxInvoices: 500,
        maxUsers: 5,
        sunatIntegration: true,
        bankingIntegration: true,
        aiFeatures: false,
        apiAccess: true,
        customReports: false,
        multiCurrency: false,
    },
    enterprise: {
        maxInvoices: Infinity,
        maxUsers: Infinity,
        sunatIntegration: true,
        bankingIntegration: true,
        aiFeatures: true,
        apiAccess: true,
        customReports: true,
        multiCurrency: true,
    },
};
export function hasFeature(tier, feature) {
    return !!tierFeatures[tier][feature];
}
export function assertFeatureDenied(tier, feature, message) {
    if (hasFeature(tier, feature)) {
        throw new Error(message ||
            `Expected feature "${feature}" to be denied for tier "${tier}"`);
    }
}
export function assertFeatureAllowed(tier, feature, message) {
    if (!hasFeature(tier, feature)) {
        throw new Error(message ||
            `Expected feature "${feature}" to be allowed for tier "${tier}"`);
    }
}
//# sourceMappingURL=index.js.map