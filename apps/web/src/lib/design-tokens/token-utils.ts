import { type BORDER_RADIUS, SHADOWS } from "./core-tokens";

export const getColorEffect = (
	color: keyof typeof SHADOWS,
	intensity: number = 1,
) => {
	const shadow = SHADOWS[color];
	if (shadow?.includes("currentColor")) {
		return shadow;
	}
	return shadow?.replace(/(\d+\.?\d*)\)/, `${intensity})`) || SHADOWS.subtle;
};

export const getShadowForTheme = (variant: keyof typeof SHADOWS) => {
	return SHADOWS[variant];
};

export const getResponsiveBorderRadius = (size: keyof typeof BORDER_RADIUS) => {
	const responsiveMap: Record<keyof typeof BORDER_RADIUS, string> = {
		sm: "rounded-[8px] sm:rounded-[8px]",
		md: "rounded-[10px] sm:rounded-[10px]",
		lg: "rounded-[12px] sm:rounded-[12px]",
		xl: "rounded-[16px] sm:rounded-[16px]",
		pill: "rounded-full sm:rounded-full",
		card: "rounded-[12px] sm:rounded-[12px]",
		modal: "rounded-[16px] sm:rounded-[16px]",
		overlay: "rounded-[16px] sm:rounded-[16px]",
		button: "rounded-[10px] sm:rounded-[10px]",
		input: "rounded-[10px] sm:rounded-[10px]",
		badge: "rounded-full sm:rounded-full",
		icon: "rounded-[8px] sm:rounded-[8px]",
		avatar: "rounded-[12px] sm:rounded-[12px]",
		dot: "rounded-full sm:rounded-full",
		tooltip: "rounded-[8px] sm:rounded-[8px]",
		dropdown: "rounded-[10px] sm:rounded-[10px]",
		notification: "rounded-[12px] sm:rounded-[12px]",
	};

	return responsiveMap[size];
};
