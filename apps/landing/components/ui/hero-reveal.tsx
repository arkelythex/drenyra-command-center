"use client";

import { type ReactElement } from "react";
import { motion, type Variants } from "framer-motion";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface HeroRevealTextProps {
	text: string;
	className?: string;
	delay?: number;
	wordDelay?: number;
}

const wordVariants: Variants = {
	hidden: {
		opacity: 0,
		y: 20,
		rotateX: -15,
		filter: "blur(4px)",
	},
	visible: {
		opacity: 1,
		y: 0,
		rotateX: 0,
		filter: "blur(0px)",
		transition: {
			type: "spring",
			damping: 20,
			stiffness: 120,
			mass: 0.5,
		},
	},
};

/**
 * Hero text with word-by-word staggered reveal animation.
 * Each word slides up, rotates in from -15deg, and deblurs simultaneously.
 * Respects prefers-reduced-motion.
 */
export function HeroRevealText({
	text,
	className,
	delay = 0,
	wordDelay = 0.08,
}: HeroRevealTextProps): ReactElement {
	const reduceMotion = useReducedMotion();
	const words = text.split(" ");

	if (reduceMotion) {
		return (
			<h1 className={className}>
				{text}
			</h1>
		);
	}

	return (
		<motion.h1
			className={className}
			variants={{
				hidden: {},
				visible: {
					transition: {
						staggerChildren: wordDelay,
						delayChildren: delay,
					},
				},
			}}
			initial="hidden"
			animate="visible"
			aria-label={text}
		>
			{words.map((word, i) => (
				<motion.span
					key={`${word}-${i}`}
					className="inline-block"
					variants={wordVariants}
					style={{ perspective: "600px" }}
				>
					{word}
					{i < words.length - 1 && "\u00A0"}
				</motion.span>
			))}
		</motion.h1>
	);
}

/**
 * Stagger container for hero content sections (eyebrow, headline, subheadline, CTAs).
 * Each child animates in sequence.
 */
export function HeroStaggerContainer({
	children,
	className,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}): ReactElement {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			variants={{
				hidden: {},
				visible: {
					transition: {
						staggerChildren: 0.12,
						delayChildren: delay,
					},
				},
			}}
			initial="hidden"
			animate="visible"
		>
			{children}
		</motion.div>
	);
}

/**
 * Individual stagger item — wraps children with fade+slide up animation.
 */
export function HeroStaggerItem({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}): ReactElement {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			variants={{
				hidden: { opacity: 0, y: 16 },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						type: "spring",
						damping: 22,
						stiffness: 140,
						mass: 0.5,
					},
				},
			}}
		>
			{children}
		</motion.div>
	);
}

/**
 * Eyebrow reveal — line draws in from left, then text fades.
 */
export function HeroEyebrowReveal({
	children,
	className,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}): ReactElement {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, x: -12 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{
				type: "spring",
				damping: 20,
				stiffness: 100,
				delay,
			}}
		>
			{children}
		</motion.div>
	);
}
