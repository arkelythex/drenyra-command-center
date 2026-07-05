import {
	BLUR,
	type BORDER_RADIUS,
	type SHADOWS,
	SPACING,
	Z_INDEX,
} from "./core-tokens";
import { ANIMATIONS } from "./motion-tokens";
import type { DIMENSIONS, TYPOGRAPHY } from "./scale-tokens";
import { BACKDROP_BLUR, GLASS_EFFECTS, GRADIENTS } from "./visual-tokens";

const borderRadiusClasses: Record<keyof typeof BORDER_RADIUS, string> = {
	sm: "rounded-[10px]",
	md: "rounded-[14px]",
	lg: "rounded-[18px]",
	xl: "rounded-[24px]",
	pill: "rounded-full",
	card: "rounded-[18px]",
	modal: "rounded-[24px]",
	overlay: "rounded-[24px]",
	button: "rounded-[14px]",
	input: "rounded-[14px]",
	badge: "rounded-full",
	icon: "rounded-[10px]",
	avatar: "rounded-[18px]",
	dot: "rounded-full",
	tooltip: "rounded-[10px]",
	dropdown: "rounded-[14px]",
	notification: "rounded-[18px]",
};

const shadowClasses: Record<keyof typeof SHADOWS, string> = {
	1: "shadow-[0_1px_0_rgba(255,255,255,0.03),0_8px_24px_rgba(0,0,0,0.35)]",
	2: "shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_48px_rgba(0,0,0,0.45)]",
	subtle: "shadow-sm",
	soft: "shadow-md",
	card: "shadow-md",
	elevated: "shadow-lg",
	modal: "shadow-xl",
	tooltip: "shadow-lg",
	tooltipStrong: "shadow-2xl",
	primary: "shadow-glow",
	blue: "shadow-glow",
	emerald: "shadow-glow",
	amber: "shadow-glow",
	red: "shadow-glow",
	glow: "shadow-glow",
	intense: "shadow-glow-strong",
	dynamic: "shadow-[0_0_8px_currentColor]",
	pulse: "shadow-[0_0_10px_currentColor]",
};

const typographyClasses: Record<keyof typeof TYPOGRAPHY, string> = {
	xxs: "text-[0.5rem]",
	xs: "text-[0.5625rem]",
	"2xs": "text-[0.625rem]",
	label: "text-[0.6875rem]",
	sm: "text-xs",
	base: "text-sm",
	md: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
	"3xl": "text-3xl",
	"4xl": "text-4xl",
	hero: "text-[3rem]",
};

const widthClasses: Record<keyof typeof DIMENSIONS.width, string> = {
	xs: "w-48",
	sm: "w-64",
	md: "w-80",
	lg: "w-96",
	xl: "w-[28rem]",
	"2xl": "w-[32rem]",
	sidebar: "w-[280px]",
	sidebarCollapsed: "w-[72px]",
};

const heightClasses: Record<keyof typeof DIMENSIONS.height, string> = {
	xs: "h-32",
	sm: "h-48",
	md: "h-64",
	lg: "h-80",
	xl: "h-96",
	"2xl": "h-[28rem]",
	header: "h-16",
	footer: "h-12",
	buttonSm: "h-[36px]",
	buttonMd: "h-[44px]",
	buttonLg: "h-[52px]",
	composer: "min-h-[48px]",
	panelHeader: "h-[44px]",
};

const maxWidthClasses: Record<keyof typeof DIMENSIONS.maxWidth, string> = {
	xs: "max-w-xs",
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"3xl": "max-w-3xl",
	"4xl": "max-w-4xl",
	"5xl": "max-w-5xl",
	"6xl": "max-w-6xl",
	"7xl": "max-w-7xl",
	container: "max-w-[75rem]",
};

const iconSizeClasses: Record<keyof typeof DIMENSIONS.icon, string> = {
	xs: "w-3 h-3",
	sm: "w-4 h-4",
	md: "w-5 h-5",
	lg: "w-6 h-6",
	xl: "w-8 h-8",
	"2xl": "w-10 h-10",
};

export const tokensToClasses = {
	borderRadius: (token: keyof typeof BORDER_RADIUS) =>
		borderRadiusClasses[token],
	shadow: (token: keyof typeof SHADOWS) => shadowClasses[token],
	blur: (token: keyof typeof BLUR) => BLUR[token],
	spacing: (token: keyof typeof SPACING) => SPACING[token],
	zIndex: (token: keyof typeof Z_INDEX) => Z_INDEX[token],
	gradient: (token: keyof typeof GRADIENTS) => GRADIENTS[token],
	backdropBlur: (token: keyof typeof BACKDROP_BLUR) => BACKDROP_BLUR[token],
	glassEffect: (token: keyof typeof GLASS_EFFECTS) => GLASS_EFFECTS[token],
	animation: (token: keyof typeof ANIMATIONS) =>
		typeof ANIMATIONS[token] === "string" ? (ANIMATIONS[token] as string) : "",
	typography: (token: keyof typeof TYPOGRAPHY) => typographyClasses[token],
	width: (token: keyof typeof DIMENSIONS.width) => widthClasses[token],
	height: (token: keyof typeof DIMENSIONS.height) => heightClasses[token],
	maxWidth: (token: keyof typeof DIMENSIONS.maxWidth) => maxWidthClasses[token],
	iconSize: (token: keyof typeof DIMENSIONS.icon) => iconSizeClasses[token],
} as const;
