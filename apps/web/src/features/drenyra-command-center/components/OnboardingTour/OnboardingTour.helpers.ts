/**
 * OnboardingTour — Pure helper functions
 */
import type { CSSProperties } from "react";
import type { TourStep } from "./OnboardingTour.types";
import { PLACEMENT_GAP, TOOLTIP_WIDTH } from "./OnboardingTour.types";

export function getTargetRect(selector: string): DOMRect | null {
	if (!selector) return null;
	const el = document.querySelector(selector);
	return el ? el.getBoundingClientRect() : null;
}

/**
 * Calculate tooltip position based on target rect and placement hint.
 * Falls back to centered when there's no target or placement is "center".
 */
export function calcTooltipPosition(
	rect: DOMRect | null,
	placement: TourStep["placement"],
): CSSProperties {
	const center: CSSProperties = {
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
	};

	if (!rect || placement === "center") return center;

	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const clampedLeft = (left: number) =>
		Math.max(PLACEMENT_GAP, Math.min(left, vw - TOOLTIP_WIDTH - PLACEMENT_GAP));
	const clampedTop = (top: number) =>
		Math.max(PLACEMENT_GAP, Math.min(top, vh - 240));

	switch (placement) {
		case "bottom": {
			const left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
			return { top: rect.bottom + PLACEMENT_GAP, left: clampedLeft(left) };
		}
		case "top": {
			const left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
			return {
				top: rect.top - PLACEMENT_GAP,
				left: clampedLeft(left),
				transform: "translateY(-100%)",
			};
		}
		case "right":
			return {
				top: clampedTop(rect.top + rect.height / 2 - 80),
				left: rect.right + PLACEMENT_GAP,
			};
		case "left":
			return {
				top: clampedTop(rect.top + rect.height / 2 - 80),
				left: rect.left - PLACEMENT_GAP,
				transform: "translateX(-100%)",
			};
		default:
			return center;
	}
}
