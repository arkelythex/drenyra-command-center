/**
 * Accessibility Hooks & Utilities
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnnouncePriority } from "./accessibility.types";

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
	const announce = useCallback(
		(message: string, priority: AnnouncePriority = "polite") => {
			// Create live region if doesn't exist
			const regionId = `sr-announcer-${priority}`;
			let region = document.getElementById(regionId);

			if (!region) {
				region = document.createElement("div");
				region.id = regionId;
				region.setAttribute("aria-live", priority);
				region.setAttribute("aria-atomic", "true");
				region.className = "sr-only";
				document.body.appendChild(region);
			}

			// Clear and set message (ensures announcement)
			region.textContent = "";
			setTimeout(() => {
				if (region) {
					region.textContent = message;
				}
			}, 100);

			// Clear after announcement (avoid repetition)
			setTimeout(() => {
				if (region) region.textContent = "";
			}, 3000);
		},
		[],
	);

	return { announce };
}

/**
 * Focus Trap Hook
 * Traps focus within a modal/dialog for accessibility
 */
export function useFocusTrap(isActive: boolean) {
	const containerRef = useRef<HTMLDivElement>(null);
	const previousFocus = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isActive) {
			return undefined;
		}

		// Store previous focus
		previousFocus.current = document.activeElement as HTMLElement;

		// Focus first focusable element
		const container = containerRef.current;
		if (container) {
			const focusableElements = container.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			const firstElement = focusableElements[0] as HTMLElement | undefined;
			if (firstElement) {
				firstElement.focus();
			}
		}

		// Handle tab key
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const activeContainer = containerRef.current;
			if (!activeContainer) return;

			const focusableElements = activeContainer.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			const firstElement = focusableElements[0] as HTMLElement | undefined;
			const lastElement = focusableElements[focusableElements.length - 1] as
				| HTMLElement
				| undefined;

			if (!firstElement || !lastElement) {
				return;
			}

			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		};

		// Handle escape key
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				// Dispatch custom event for parent to handle close
				document.dispatchEvent(new CustomEvent("focus-trap-escape"));
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keydown", handleEscape);
			// Restore previous focus
			if (previousFocus.current) {
				previousFocus.current.focus();
			}
		};
	}, [isActive]);

	return containerRef;
}

/**
 * High Contrast Mode Detector
 */
export function useHighContrastMode() {
	const [isHighContrast, setIsHighContrast] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-contrast: high)");

		setIsHighContrast(mediaQuery.matches);

		const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return isHighContrast;
}

/**
 * Reduced Motion Detector (already in framer-motion, but useful standalone)
 */
export function usePrefersReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

		setPrefersReducedMotion(mediaQuery.matches);

		const handler = (e: MediaQueryListEvent) =>
			setPrefersReducedMotion(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return prefersReducedMotion;
}
