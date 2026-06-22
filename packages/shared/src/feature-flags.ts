/**
 * Feature Flags for ARKELYTHEX
 *
 * Centralized feature flag management for A/B testing,
 * gradual rollouts, and feature toggles.
 */

export type FeatureFlag = {
	key: string;
	enabled: boolean;
	description?: string;
	rolloutPercentage?: number; // 0-100
};

export type SubscriptionTier =
	| "FREE"
	| "STARTER"
	| "PROFESSIONAL"
	| "ENTERPRISE";

// Feature flags for different product areas
export const FEATURE_FLAGS = {
	// AI Features
	AI_CORTEX: "ai_cortex",
	AI_INSIGHTS: "ai_insights",
	AI_SWARM: "ai_swarm",
	AI_RAG: "ai_rag",

	// Billing Features
	MULTI_RUC: "multi_ruc",
	API_ACCESS: "api_access",
	SSO: "sso",
	CUSTOM_DOMAINS: "custom_domains",

	// Feature Gates
	BANKING_INTEGRATION: "banking_integration",
	EXPORT_PDF: "export_pdf",
	EXPORT_EXCEL: "export_excel",
	ADVANCED_REPORTING: "advanced_reporting",

	// Beta Features
	BETA_SIRE: "beta_sire",
	BETA_DASHBOARD: "beta_dashboard",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Get feature flag status for a given tenant/subscription tier
 */
export function getFeatureFlag(
	flag: FeatureFlagKey,
	tier: SubscriptionTier,
): boolean {
	const tierFeatures: Record<SubscriptionTier, FeatureFlagKey[]> = {
		FREE: [FEATURE_FLAGS.EXPORT_PDF],
		STARTER: [FEATURE_FLAGS.EXPORT_PDF, FEATURE_FLAGS.EXPORT_EXCEL],
		PROFESSIONAL: [
			FEATURE_FLAGS.AI_CORTEX,
			FEATURE_FLAGS.AI_INSIGHTS,
			FEATURE_FLAGS.BANKING_INTEGRATION,
			FEATURE_FLAGS.EXPORT_PDF,
			FEATURE_FLAGS.EXPORT_EXCEL,
			FEATURE_FLAGS.BETA_SIRE,
		],
		ENTERPRISE: Object.values(FEATURE_FLAGS),
	};

	return tierFeatures[tier]?.includes(flag) ?? false;
}

/**
 * Check if a feature is enabled for a specific tenant
 */
export function isEnabled(
	flag: FeatureFlagKey,
	tenantFeatures?: Record<FeatureFlagKey, boolean>,
): boolean {
	// Check tenant-specific overrides first
	if (tenantFeatures && flag in tenantFeatures) {
		return tenantFeatures[flag];
	}

	// Default to false for gated features
	return false;
}

/**
 * Get all features for a subscription tier
 */
export function getTierFeatures(tier: SubscriptionTier): FeatureFlagKey[] {
	const tierFeatures: Record<SubscriptionTier, FeatureFlagKey[]> = {
		FREE: [FEATURE_FLAGS.EXPORT_PDF],
		STARTER: [
			FEATURE_FLAGS.EXPORT_PDF,
			FEATURE_FLAGS.EXPORT_EXCEL,
			FEATURE_FLAGS.BETA_DASHBOARD,
		],
		PROFESSIONAL: [
			FEATURE_FLAGS.AI_CORTEX,
			FEATURE_FLAGS.AI_INSIGHTS,
			FEATURE_FLAGS.BANKING_INTEGRATION,
			FEATURE_FLAGS.EXPORT_PDF,
			FEATURE_FLAGS.EXPORT_EXCEL,
			FEATURE_FLAGS.ADVANCED_REPORTING,
			FEATURE_FLAGS.BETA_SIRE,
			FEATURE_FLAGS.BETA_DASHBOARD,
		],
		ENTERPRISE: Object.values(FEATURE_FLAGS),
	};

	return tierFeatures[tier] ?? [];
}
