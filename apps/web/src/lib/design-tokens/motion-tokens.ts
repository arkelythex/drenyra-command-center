export const ANIMATIONS = {
	entrance: "animate-entrance",
	zoom: "animate-zoom",
	spin: "animate-spin",
	spinSlow: "animate-spin-slow",
	pulse: "animate-pulse",
	bounce: "animate-bounce",
	duration: {
		fast: "120ms",
		normal: "180ms",
		slow: "260ms",
		verySlow: "520ms",
	},
	keyframes: {
		entrance: { from: { opacity: 0, y: 10 }, to: { opacity: 1, y: 0 } },
		zoom: { from: { opacity: 0, scale: 0.95 }, to: { opacity: 1, scale: 1 } },
		slideIn: { from: { x: -20, opacity: 0 }, to: { x: 0, opacity: 1 } },
		fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
	},
} as const;

export const MOTION_VARIANTS = {
	spring: {
		type: "spring" as const,
		stiffness: 340,
		damping: 28,
		mass: 0.9,
	},
	springGentle: {
		type: "spring" as const,
		stiffness: 220,
		damping: 30,
		mass: 1,
	},
	springBouncy: {
		type: "spring" as const,
		stiffness: 400,
		damping: 18,
		mass: 0.86,
	},
	springInertia: {
		type: "spring" as const,
		stiffness: 280,
		damping: 24,
		mass: 1.1,
	},
	smooth: {
		type: "tween" as const,
		duration: 0.18,
		ease: [0.2, 0.8, 0.2, 1] as const,
	},
	quick: {
		type: "tween" as const,
		duration: 0.12,
		ease: [0.16, 1, 0.3, 1] as const,
	},
	bounce: {
		type: "tween" as const,
		duration: 0.26,
		ease: [0.2, 0.8, 0.2, 1] as const,
	},
} as const;
