/**
 * Tenant Context Helpers
 *
 * Provides utilities for multi-tenant testing: creating tenant contexts,
 * asserting tenant isolation, and generating tenant-specific test data.
 *
 * CRITICAL: ARKELYTHEX is a multi-tenant SaaS. Every test MUST verify that
 * data from Tenant A is never accessible by Tenant B.
 */

/**
 * Represents a tenant context for testing.
 */
export interface TenantContext {
	tenantId: string;
	tenantName: string;
	subscriptionTier: "free" | "pro" | "enterprise";
	ruc: string;
	headers: Record<string, string>;
}

/**
 * Create a tenant context with appropriate headers for API requests.
 *
 * @param options - Tenant configuration
 * @returns TenantContext with headers for authenticated requests
 */
export function createTenantContext(options: {
	tenantId: string;
	tenantName: string;
	subscriptionTier: "free" | "pro" | "enterprise";
	ruc: string;
	authToken?: string;
}): TenantContext {
	const headers: Record<string, string> = {
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

/**
 * Pre-built tenant contexts for common test scenarios.
 */
export const tenantFixtures = {
	/** Free-tier tenant with limited features. */
	freeTenant: createTenantContext({
		tenantId: "tenant-free-001",
		tenantName: "Free Tenant SAC",
		subscriptionTier: "free",
		ruc: "20601234567",
	}),

	/** Pro-tier tenant with standard features. */
	proTenant: createTenantContext({
		tenantId: "tenant-pro-001",
		tenantName: "Pro Tenant SAC",
		subscriptionTier: "pro",
		ruc: "20609876543",
	}),

	/** Enterprise-tier tenant with all features. */
	enterpriseTenant: createTenantContext({
		tenantId: "tenant-enterprise-001",
		tenantName: "Enterprise Tenant SAC",
		subscriptionTier: "enterprise",
		ruc: "20601112233",
	}),
} as const;

/**
 * Assert that a response indicates tenant isolation (403 Forbidden).
 *
 * @param response - API response object
 * @param message - Optional custom assertion message
 */
export function assertTenantIsolation(
	response: { status: number; data?: unknown },
	message?: string,
): void {
	const msg = message || "Expected tenant isolation (403 Forbidden)";
	if (response.status !== 403) {
		throw new Error(
			`${msg}. Expected status 403, got ${response.status}. ` +
				`Response: ${JSON.stringify(response.data)}`,
		);
	}
}

/**
 * Assert that data belongs to the expected tenant.
 *
 * @param data - Response data object
 * @param expectedTenantId - Expected tenant ID
 * @param message - Optional custom assertion message
 */
export function assertTenantData(
	data: Record<string, unknown> | Array<Record<string, unknown>>,
	expectedTenantId: string,
	message?: string,
): void {
	const msg =
		message || `Expected data to belong to tenant ${expectedTenantId}`;

	const items = Array.isArray(data) ? data : [data];

	for (const item of items) {
		const tenantId =
			item.tenantId ?? item.tenant_id ?? item.companyId ?? item.company_id;
		if (tenantId !== expectedTenantId) {
			throw new Error(
				`${msg}. Expected tenantId "${expectedTenantId}", got "${tenantId}". ` +
					`Data: ${JSON.stringify(item)}`,
			);
		}
	}
}

/**
 * Generate a unique tenant ID for test isolation.
 *
 * @param prefix - Optional prefix (default: 'test-tenant')
 * @returns Unique tenant ID
 */
export function generateTenantId(prefix = "test-tenant"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Feature flags by subscription tier.
 * Used to test feature gating in multi-tenant scenarios.
 */
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
} as const;

/**
 * Check if a feature is available for a given subscription tier.
 *
 * @param tier - Subscription tier
 * @param feature - Feature flag key
 * @returns Whether the feature is available
 */
export function hasFeature<K extends keyof (typeof tierFeatures)["free"]>(
	tier: "free" | "pro" | "enterprise",
	feature: K,
): boolean {
	return !!tierFeatures[tier][feature];
}

/**
 * Assert that a feature is NOT available for a tenant's tier.
 *
 * @param tier - Subscription tier
 * @param feature - Feature flag key
 * @param message - Optional custom assertion message
 */
export function assertFeatureDenied(
	tier: "free" | "pro" | "enterprise",
	feature: keyof (typeof tierFeatures)["free"],
	message?: string,
): void {
	if (hasFeature(tier, feature)) {
		throw new Error(
			message ||
				`Expected feature "${feature}" to be denied for tier "${tier}"`,
		);
	}
}

/**
 * Assert that a feature IS available for a tenant's tier.
 *
 * @param tier - Subscription tier
 * @param feature - Feature flag key
 * @param message - Optional custom assertion message
 */
export function assertFeatureAllowed(
	tier: "free" | "pro" | "enterprise",
	feature: keyof (typeof tierFeatures)["free"],
	message?: string,
): void {
	if (!hasFeature(tier, feature)) {
		throw new Error(
			message ||
				`Expected feature "${feature}" to be allowed for tier "${tier}"`,
		);
	}
}
