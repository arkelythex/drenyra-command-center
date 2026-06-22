/**
 * useAnalytics Hook - Simple version for components that only track clicks
 * Does NOT use useSearchParams - safe for SSR
 */

"use client";

import { useCallback } from "react";

import { analytics } from "./analytics";

export function useAnalytics() {
	const trackCtaClick = useCallback((ctaId: string, location: string) => {
		analytics.trackCtaClick(ctaId, location);
	}, []);

	const trackPricingView = useCallback((planId: string) => {
		analytics.trackPricingView(planId);
	}, []);

	const trackPricingClick = useCallback((planId: string, location: string) => {
		analytics.trackPricingClick(planId, location);
	}, []);

	const trackNewsletterSignup = useCallback((email: string, source: string) => {
		analytics.trackNewsletterSignup(email, source);
	}, []);

	const trackDemoRequest = useCallback((plan: string) => {
		analytics.trackDemoRequest(plan);
	}, []);

	const trackScrollDepth = useCallback((depth: number) => {
		analytics.trackScrollDepth(depth);
	}, []);

	const trackSireFunnelClick = useCallback((placement: string) => {
		analytics.trackSireFunnelClick(placement);
	}, []);

	const trackSireFunnelLand = useCallback((entry?: "internal" | "direct" | "unknown") => {
		analytics.trackSireFunnelLand(entry);
	}, []);

	// Page view tracking is handled by AnalyticsProvider in layout
	// These methods return undefined to match the full useAnalytics signature
	return {
		trackCtaClick,
		trackPricingView,
		trackPricingClick,
		trackNewsletterSignup,
		trackDemoRequest,
		trackScrollDepth,
		trackSireFunnelClick,
		trackSireFunnelLand,
	} as const;
}
