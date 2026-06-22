/**
 * ScrollDepthTracker Component
 * Tracks scroll depth at 25%, 50%, 75%, 100% intervals
 * Used for analytics on landing page engagement
 */

"use client";

import { useEffect, useRef } from "react";

import { useAnalytics } from "@/lib/use-analytics";

export function ScrollDepthTracker(): React.ReactElement {
	const { trackScrollDepth } = useAnalytics();
	const maxScrollRef = useRef(0);
	const tickingRef = useRef(false);

	useEffect(() => {
		const handleScroll = (): void => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight;
			const windowHeight = window.innerHeight;

			// Calculate scroll percentage
			const scrollableHeight = docHeight - windowHeight;
			if (scrollableHeight <= 0) return;

			const scrollPercent = Math.round((scrollTop / scrollableHeight) * 100);

			// Track only when passing thresholds and at new max
			if (scrollPercent > maxScrollRef.current) {
				maxScrollRef.current = scrollPercent;

				// Determine which threshold was crossed
				if (scrollPercent >= 25 && scrollPercent < 50) {
					trackScrollDepth(25);
				} else if (scrollPercent >= 50 && scrollPercent < 75) {
					trackScrollDepth(50);
				} else if (scrollPercent >= 75 && scrollPercent < 100) {
					trackScrollDepth(75);
				} else if (scrollPercent >= 100) {
					trackScrollDepth(100);
				}
			}

			tickingRef.current = false;
		};

		const throttledScrollHandler = (): void => {
			if (!tickingRef.current) {
				window.requestAnimationFrame(handleScroll);
				tickingRef.current = true;
			}
		};

		window.addEventListener("scroll", throttledScrollHandler, { passive: true });
		return () => window.removeEventListener("scroll", throttledScrollHandler);
	}, [trackScrollDepth]);

	return <></>;
}
