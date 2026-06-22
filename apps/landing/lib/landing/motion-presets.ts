import type { Transition } from "framer-motion";

const instant: Transition = { duration: 0 };

/** Bottom floating CTA bar (mobile) */
export function landingFloatBarMotion(reduceMotion: boolean) {
	if (reduceMotion) {
		return {
			initial: { opacity: 1, y: 0 },
			animate: { opacity: 1, y: 0 },
			exit: { opacity: 1, y: 0 },
			transition: instant,
		};
	}
	return {
		initial: { opacity: 0, y: 100 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 100 },
		transition: { duration: 0.3, ease: "easeOut" as const },
	};
}

/** Fixed side sticky panel (desktop) */
export function landingStickyPanelMotion(reduceMotion: boolean) {
	if (reduceMotion) {
		return {
			initial: { opacity: 1, x: 0, y: 0 },
			animate: { opacity: 1, x: 0, y: 0 },
			exit: { opacity: 1, x: 0, y: 0 },
			transition: instant,
		};
	}
	return {
		initial: { opacity: 0, x: 20, y: 8 },
		animate: { opacity: 1, x: 0, y: 0 },
		exit: { opacity: 0, x: 20, y: 8 },
		transition: { duration: 0.3 },
	};
}
