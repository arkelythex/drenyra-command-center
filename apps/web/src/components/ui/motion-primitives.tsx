import type { HTMLMotionProps, Variants } from "framer-motion";
import {
	domAnimation,
	LazyMotion,
	motion,
	useInView,
	useReducedMotion,
	useSpring,
	useTransform,
} from "framer-motion";
import { type ReactNode, type Ref, useEffect, useRef } from "react";
import { MOTION_VARIANTS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Drenyra "Elite" Physics Constants
 * Inspired by iOS Spring Physics (WWDC 2024 Patterns)
 */
export const SPRING_PHYSICS = {
	stiffness: Math.min(MOTION_VARIANTS.spring.stiffness, 240),
	damping: Math.max(MOTION_VARIANTS.spring.damping, 28),
	mass: MOTION_VARIANTS.spring.mass,
};

export const STAGGER_CHILDREN = 0.015;

/**
 * LazyMotion Provider to reduce initial bundle size
 */
export function MotionProvider({ children }: { children: ReactNode }) {
	return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

/**
 * Standardized Entrance Animation Variants
 */
export const entranceVariants: Variants = {
	hidden: { opacity: 0, y: 6 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.14,
			ease: "easeOut",
		},
	},
};

export const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: STAGGER_CHILDREN,
		},
	},
};

const MOTION_TAG_COMPONENTS = {
	div: motion.div,
	section: motion.section,
	article: motion.article,
	aside: motion.aside,
	header: motion.header,
	footer: motion.footer,
	main: motion.main,
	span: motion.span,
	form: motion.form,
} as const;

type MotionTag = keyof typeof MOTION_TAG_COMPONENTS;

type MotionDivAnimationInput = Pick<
	HTMLMotionProps<"div">,
	"animate" | "initial" | "variants"
> & {
	shouldReduceMotion: boolean;
};

export function resolveMotionDivAnimation({
	animate,
	initial,
	shouldReduceMotion,
	variants,
}: MotionDivAnimationInput): Pick<
	HTMLMotionProps<"div">,
	"animate" | "initial" | "variants"
> {
	if (shouldReduceMotion) {
		return {
			animate: undefined,
			initial: false,
			variants: undefined,
		};
	}

	return {
		animate,
		initial,
		variants,
	};
}

export function formatAnimatedNumberValue(
	value: number,
	precision: number,
	formatter: (value: number) => string,
): string {
	return formatter(Number(value.toFixed(precision)));
}

/**
 * Motion Wrapper for Divs (Polymorphic)
 */
export function MotionDiv({
	className,
	variants,
	initial = false,
	animate,
	tagName = "div",
	ref,
	...props
}: HTMLMotionProps<"div"> & { tagName?: MotionTag } & {
	ref?: Ref<HTMLDivElement>;
}) {
	const shouldReduceMotion = useReducedMotion() === true;
	// Polymorphic tags share MotionProps but ref targets differ; keep div ref for the wrapper API.
	const Component = (MOTION_TAG_COMPONENTS[tagName] ??
		motion.div) as typeof motion.div;

	const {
		animate: resolvedAnimate,
		initial: resolvedInitial,
		variants: resolvedVariants,
	} = resolveMotionDivAnimation({
		animate,
		initial,
		shouldReduceMotion,
		variants,
	});

	return (
		<Component
			ref={ref}
			variants={resolvedVariants}
			initial={resolvedInitial}
			animate={resolvedAnimate}
			className={cn(className)}
			{...props}
		/>
	);
}

/**
 * Motion Wrapper for Buttons with Tap/Hover feedback
 */
export function MotionButton({
	className,
	whileHover,
	whileTap,
	ref,
	...props
}: HTMLMotionProps<"button"> & { ref?: Ref<HTMLButtonElement> }) {
	const shouldReduceMotion = useReducedMotion() === true;

	return (
		<motion.button
			ref={ref}
			whileHover={shouldReduceMotion ? undefined : whileHover}
			whileTap={shouldReduceMotion ? undefined : whileTap}
			transition={
				shouldReduceMotion ? undefined : { duration: 0.1, ease: "easeOut" }
			}
			className={cn(className)}
			{...props}
		/>
	);
}

/**
 * Shared Layout ID Wrapper for complex transitions (One UI / iOS style)
 */
export const LayoutTransition = motion.div;

/**
 * ELITE DATA VISUALIZATION: Animated Number (Ticker)
 * Animates numbers smoothly using spring physics.
 */
export function AnimatedNumber({
	value,
	precision = 0,
	formatter = (v: number) => v.toLocaleString(),
	className,
}: {
	value: number;
	duration?: number;
	precision?: number;
	formatter?: (v: number) => string;
	className?: string;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true });
	const shouldReduceMotion = useReducedMotion() === true;
	const staticDisplayValue = formatAnimatedNumberValue(
		value,
		precision,
		formatter,
	);

	const springValue = useSpring(0, {
		stiffness: shouldReduceMotion
			? 1000
			: MOTION_VARIANTS.springGentle.stiffness,
		damping: shouldReduceMotion ? 1000 : MOTION_VARIANTS.springGentle.damping,
		mass: MOTION_VARIANTS.springGentle.mass,
		restDelta: 0.001,
	});

	const displayValue = useTransform(springValue, (current) => {
		return formatAnimatedNumberValue(Number(current), precision, formatter);
	});

	useEffect(() => {
		if (shouldReduceMotion) return;
		if (isInView) {
			springValue.set(value);
		}
	}, [value, springValue, isInView, shouldReduceMotion]);

	if (shouldReduceMotion) {
		return (
			<span ref={ref} className={cn("tabular-nums", className)}>
				{staticDisplayValue}
			</span>
		);
	}

	return (
		<motion.span ref={ref} className={cn("tabular-nums", className)}>
			{displayValue}
		</motion.span>
	);
}
