"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";

/**
 * Tracks when a section enters the viewport using IntersectionObserver.
 * Reports each section once per session to avoid spam.
 */
export function SectionVisibilityTracker({
	sectionId,
	threshold = 0.3,
}: {
	readonly sectionId: string;
	readonly threshold?: number;
}): React.ReactNode {
	const hasTracked = useRef(false);

	useEffect(() => {
		const el = document.getElementById(sectionId);
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !hasTracked.current) {
						hasTracked.current = true;
						analytics.track("section_view", {
							section: sectionId,
							scrollY: window.scrollY,
						});
					}
				}
			},
			{ threshold },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [sectionId, threshold]);

	return null;
}
