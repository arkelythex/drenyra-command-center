/**
 * OnboardingTour — Types and constants
 */

export const STORAGE_KEY = "drenyra:onboarding-completed";
export const TOOLTIP_WIDTH = 320;
export const PLACEMENT_GAP = 16;

export interface TourStep {
	/** CSS selector to highlight (empty string for centered/step 5) */
	targetSelector: string;
	title: string;
	description: string;
	/** Preferred placement relative to the target */
	placement: "bottom" | "top" | "left" | "right" | "center";
}
