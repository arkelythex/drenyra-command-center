"use client";

import type { ReactElement } from "react";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface CursorState {
	x: number;
	y: number;
	isHovering: boolean;
	variant: "default" | "pointer" | "text" | "link";
}

/**
 * Custom cursor for desktop — replaces default cursor with a smooth-following dot.
 * Changes size/shape based on what's being hovered.
 * Hidden on touch devices.
 */
export function CustomCursor(): ReactElement {
	const [cursor, setCursor] = useState<CursorState>({
		x: 0,
		y: 0,
		isHovering: false,
		variant: "default",
	});
	const [isVisible, setIsVisible] = useState(false);
	const [isTouchDevice] = useState(() => {
		if (typeof window === "undefined") return true;
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	});
	const reduceMotion = useReducedMotion();
	const rafRef = useRef<number>(0);
	const targetRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		if (isTouchDevice) return;

		let running = true;

		const tick = (): void => {
			if (!running) return;
			const lerp = reduceMotion ? 1 : 0.15;
			currentRef.current.x += (targetRef.current.x - currentRef.current.x) * lerp;
			currentRef.current.y += (targetRef.current.y - currentRef.current.y) * lerp;

			setCursor((prev) => ({
				...prev,
				x: currentRef.current.x,
				y: currentRef.current.y,
			}));

			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);

		const handleMouseMove = (e: MouseEvent): void => {
			targetRef.current = { x: e.clientX, y: e.clientY };
			setIsVisible(true);
		};

		const handleMouseOver = (e: MouseEvent): void => {
			const target = e.target as HTMLElement;
			const computed = window.getComputedStyle(target).cursor;

			let variant: CursorState["variant"] = "default";
			if (computed === "pointer") {
				const tag = target.tagName.toLowerCase();
				if (tag === "a" || tag === "button" || target.closest("a") || target.closest("button")) {
					variant = "link";
				} else {
					variant = "pointer";
				}
			} else if (computed === "text" || computed === "text-select") {
				variant = "text";
			}

			setCursor((prev) => ({
				...prev,
				isHovering: variant !== "default",
				variant,
			}));
		};

		const handleMouseLeave = (): void => {
			setIsVisible(false);
			setCursor((prev) => ({
				...prev,
				isHovering: false,
				variant: "default",
			}));
		};

		document.addEventListener("mousemove", handleMouseMove, { passive: true });
		document.addEventListener("mouseover", handleMouseOver, { passive: true });
		document.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			running = false;
			cancelAnimationFrame(rafRef.current);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseover", handleMouseOver);
			document.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [isTouchDevice, reduceMotion]);

	if (isTouchDevice) {
		return <style>{`*, *::before, *::after { cursor: auto !important; }`}</style>;
	}

	const getCursorSize = (): number => {
		switch (cursor.variant) {
			case "link":
				return 40;
			case "pointer":
				return 32;
			case "text":
				return 4;
			default:
				return 8;
		}
	};

	const getCursorOpacity = (): number => {
		if (!isVisible) return 0;
		if (cursor.variant === "text") return 0.4;
		if (cursor.isHovering) return 0.8;
		return 0.6;
	};

	return (
		<>
			{/* Hide default cursor on desktop */}
			<style>{`
				@media (hover: hover) and (pointer: fine) {
					*, *::before, *::after { cursor: none !important; }
				}
			`}</style>

			<AnimatePresence>
				{isVisible && (
					<motion.div
						aria-hidden
						className="pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference"
						style={{
							x: cursor.x - getCursorSize() / 2,
							y: cursor.y - getCursorSize() / 2,
							width: getCursorSize(),
							height: getCursorSize(),
						}}
						initial={{ opacity: 0, scale: 0 }}
						animate={{
							opacity: getCursorOpacity(),
							scale: 1,
						}}
						exit={{ opacity: 0, scale: 0 }}
						transition={{
							opacity: { duration: 0.15 },
							scale: { type: "spring", damping: 20, stiffness: 200 },
						}}
					>
						<div
							className="h-full w-full rounded-full bg-white"
							style={{
								borderRadius: cursor.variant === "text" ? "1px" : "50%",
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
