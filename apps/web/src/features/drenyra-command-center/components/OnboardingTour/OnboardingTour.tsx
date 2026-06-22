/**
 * OnboardingTour — Interactive first-time walkthrough for Drenyra Command Center.
 *
 * Guides new users through 5 key areas of the fiscal command center with
 * tooltip-style popovers, target highlighting, and step-by-step navigation.
 *
 * Persists completion to localStorage so it only shows once.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEY } from "./OnboardingTour.types";
import { TOUR_STEPS } from "./OnboardingTour.data";
import { calcTooltipPosition, getTargetRect } from "./OnboardingTour.helpers";
import { TourBackdrop } from "./components/TourBackdrop";
import { TourHighlight } from "./components/TourHighlight";
import { TourTooltip } from "./components/TourTooltip";

export function OnboardingTour() {
	const [step, setStep] = useState(0);
	const [completed, setCompleted] = useState(true);
	const [mounted, setMounted] = useState(false);
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [fadeIn, setFadeIn] = useState(false);
	const prevStepRef = useRef(step);

	// Check localStorage on mount + auto-trigger after 500ms
	useEffect(() => {
		setMounted(true);
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "true") {
			setCompleted(true);
			return;
		}
		const timer = setTimeout(() => {
			setCompleted(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	// Measure target on step change + resize/scroll
	const measure = useCallback(() => {
		const s = TOUR_STEPS[step];
		if (!s || completed) return;
		setRect(getTargetRect(s.targetSelector));
	}, [step, completed]);

	useEffect(() => {
		measure();
		// Fade-in on step change
		setFadeIn(false);
		const fadeTimer = setTimeout(() => setFadeIn(true), 30);
		window.addEventListener("resize", measure);
		window.addEventListener("scroll", measure, true);
		return () => {
			clearTimeout(fadeTimer);
			window.removeEventListener("resize", measure);
			window.removeEventListener("scroll", measure, true);
		};
	}, [measure]);

	// ── Navigation ──────────────────────────────────────────────────────────

	const goTo = useCallback((s: number) => {
		prevStepRef.current = s;
		setStep(s);
	}, []);

	const handleNext = useCallback(() => {
		if (step < TOUR_STEPS.length - 1) {
			goTo(step + 1);
		} else {
			localStorage.setItem(STORAGE_KEY, "true");
			setCompleted(true);
		}
	}, [step, goTo]);

	const handlePrev = useCallback(() => {
		if (step > 0) goTo(step - 1);
	}, [step, goTo]);

	const handleSkip = useCallback(() => {
		localStorage.setItem(STORAGE_KEY, "true");
		setCompleted(true);
	}, []);

	// ── Keyboard shortcut ────────────────────────────────────────────────────

	useEffect(() => {
		if (completed) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleSkip();
			if (e.key === "ArrowRight") handleNext();
			if (e.key === "ArrowLeft") handlePrev();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [completed, handleNext, handlePrev, handleSkip]);

	// ── Render ──────────────────────────────────────────────────────────────

	if (!mounted || completed) return null;

	const currentStep = TOUR_STEPS[step];
	const isFirst = step === 0;
	const isLast = step === TOUR_STEPS.length - 1;
	const tooltipPos = calcTooltipPosition(rect, currentStep.placement);

	return (
		<>
			<TourBackdrop fadeIn={fadeIn} />
			<TourHighlight rect={rect} />
			<TourTooltip
				step={step}
				totalSteps={TOUR_STEPS.length}
				currentStep={currentStep}
				tooltipStyle={tooltipPos}
				fadeIn={fadeIn}
				isFirst={isFirst}
				isLast={isLast}
				onNext={handleNext}
				onPrev={handlePrev}
				onSkip={handleSkip}
				onGoTo={goTo}
			/>
		</>
	);
}
