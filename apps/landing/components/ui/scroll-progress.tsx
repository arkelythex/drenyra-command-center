"use client";

import type { ReactElement } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/**
 * Thin scroll-progress bar pinned to the top of the viewport.
 * Uses framer-motion `useScroll` + `useSpring` for smooth 60fps animation.
 * Respects prefers-reduced-motion.
 */
export function ScrollProgress(): ReactElement | null {
	const reduceMotion = useReducedMotion();
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001,
	});

	if (reduceMotion) return null;

	return (
		<div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
			<motion.div
				className="h-full origin-left bg-gradient-to-r from-foreground/40 via-foreground/70 to-foreground"
				style={{ scaleX }}
			/>
		</div>
	);
}
