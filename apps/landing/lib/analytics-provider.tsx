/**
 * Analytics Provider
 * Wraps useSearchParams in a Suspense boundary for proper SSR support
 */

"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { analytics } from "./analytics";

function AnalyticsTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		const pageName =
			pathname +
			(searchParams?.toString() ? `?${searchParams.toString()}` : "");
		analytics.trackPageView(pageName);
	}, [pathname, searchParams]);

	return null;
}

interface AnalyticsProviderProps {
	children: ReactNode;
}

// The tracker wrapped in Suspense - use this in your layout
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
	return (
		<Suspense fallback={null}>
			<AnalyticsTracker />
			{children}
		</Suspense>
	);
}
